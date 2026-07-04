import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { ScanData } from "./types";

const PROMPT = `You are reading a photo of an InBody 970 body composition printout.
Extract these fields. Numbers should be plain numbers (no units).
Datetime is ISO 8601 local time, e.g. "2026-05-16T12:07:00".

- card_id            : ID number from top-left identity box (zero-pad to 10 digits if shorter)
- height_cm          : integer cm (round if decimal)
- age                : integer years
- gender             : "M" or "F"
- measured_at        : ISO 8601 timestamp
- weight_kg
- smm_kg             : skeletal muscle mass
- bfm_kg             : body fat mass
- tbw_l              : total body water (L)
- protein_kg
- mineral_kg
- ecw_tbw_ratio      : total ECW/TBW ratio (e.g. 0.365)
- score              : InBody score 0-100
- target_weight_kg
- weight_control_kg  : signed
- fat_control_kg     : signed
- muscle_control_kg  : signed (use 0 if not shown)`;

const ScanSchema = z.object({
  card_id: z.string(),
  height_cm: z.number().int(),
  age: z.number().int(),
  gender: z.enum(["M", "F"]),
  measured_at: z.string(),
  weight_kg: z.number(),
  smm_kg: z.number(),
  bfm_kg: z.number(),
  tbw_l: z.number(),
  protein_kg: z.number(),
  mineral_kg: z.number(),
  ecw_tbw_ratio: z.number(),
  score: z.number().int(),
  target_weight_kg: z.number(),
  weight_control_kg: z.number(),
  fat_control_kg: z.number(),
  muscle_control_kg: z.number(),
});

export async function extractScan(
  data: Buffer,
  mime: string = "image/jpeg",
): Promise<ScanData> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  const part = mime.startsWith("image/")
    ? { type: "image" as const, image: data, mimeType: mime }
    : { type: "file" as const, data, mimeType: mime };

  const { object } = await generateObject({
    model: google("gemini-3.5-flash"),
    schema: ScanSchema,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: PROMPT }, part],
      },
    ],
  });

  return object;
}
