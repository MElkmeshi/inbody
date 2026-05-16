import QRCode from "qrcode";
import { QR_URL_PREFIX, REFERENCE, type ScanData } from "./types";

function fmt(value: number, width: number, scale: number, signed = false): string {
  const n = Math.round(value * scale);
  if (signed) {
    const sign = n >= 0 ? "+" : "-";
    return sign + String(Math.abs(n)).padStart(width - 1, "0");
  }
  return String(n).padStart(width, "0");
}

function tsString(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`bad measured_at: ${iso}`);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

export function buildPayload(scan: ScanData): string {
  const model = "970";
  const serial = "1I422000192";
  let payload = REFERENCE;

  const card = scan.card_id.padStart(10, "0").slice(-10);
  const height = String(Math.round(scan.height_cm)).padStart(3, "0");
  const age = String(Math.round(scan.age)).padStart(4, "0");
  const gender = scan.gender.toUpperCase().startsWith("M") ? "M" : "F";
  const ts = tsString(scan.measured_at);
  const header = `${model}-3${serial}${card}!!!!${height}${age}0${gender}${ts}`;
  payload = header + payload.slice(header.length);

  // 4-char numeric chunks from end-of-header to start of the signed block.
  const signedNeedle = "-0074-0120+0046";
  const signedAnchor = payload.indexOf(signedNeedle, header.length);
  if (signedAnchor < 0) throw new Error("reference signed block not found");

  const chunks: string[] = [];
  for (let i = header.length; i < signedAnchor; i += 4) {
    chunks.push(payload.slice(i, i + 4));
  }

  const setChunk = (idx: number, value: number | undefined | null, scale: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return;
    chunks[idx] = fmt(value, 4, scale);
  };

  setChunk(6,  scan.protein_kg,   10);
  setChunk(9,  scan.mineral_kg,   100);
  setChunk(12, scan.bfm_kg,       10);
  setChunk(15, scan.tbw_l,        10);
  setChunk(24, scan.weight_kg,    10);
  setChunk(28, scan.smm_kg,       10);
  setChunk(49, scan.ecw_tbw_ratio, 1000);
  setChunk(55, scan.score,         1);

  payload = payload.slice(0, header.length) + chunks.join("") + payload.slice(signedAnchor);

  // Replace the trailing target(4) + signed control triple in one shot.
  const signedParts = [
    fmt(scan.target_weight_kg,   4, 10),
    fmt(scan.weight_control_kg,  5, 10, true),
    fmt(scan.fat_control_kg,     5, 10, true),
    fmt(scan.muscle_control_kg,  5, 10, true),
  ].join("");
  const newAnchor = payload.indexOf(signedNeedle, header.length);
  const before = payload.slice(0, newAnchor - 4);
  const after = payload.slice(newAnchor + signedNeedle.length);
  payload = before + signedParts + after;

  return QR_URL_PREFIX + payload;
}

export async function renderQrPng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });
}
