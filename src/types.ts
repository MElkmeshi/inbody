export interface ScanData {
  card_id: string;
  height_cm: number;
  age: number;
  gender: "M" | "F";
  measured_at: string;
  weight_kg: number;
  smm_kg: number;
  bfm_kg: number;
  tbw_l: number;
  protein_kg: number;
  mineral_kg: number;
  ecw_tbw_ratio: number;
  score: number;
  target_weight_kg: number;
  weight_control_kg: number;
  fat_control_kg: number;
  muscle_control_kg: number;
}

export const QR_URL_PREFIX = "https://qrcode.inbody.com?IBData=";

// Reference InBody 970 payload decoded from a real scan. Anything not
// substituted via ScanData is passed through verbatim so the QR still
// parses cleanly in the InBody app.
export const REFERENCE =
  "970-31I4220001920918507076!!!!17300220M20250531101904" +
  "0235023002800140014001720102009901210361034304190219007901580375037004520482047505810513050406160732" +
  "0559075711120286091402213024502990283090508780271086608410235094009130774088908630767088008550374037603740373037203750630658" +
  "-0074-0120+0046001402443001502503011902852002901736002901719147900990080009009730337032804020020002100370026002400520052008300620059005000490089004500460058" +
  "PASS0!!!!!!!!!!!!!!0658000001500044970DM-0411!!!!!!022000000700631121311103060282034400185025003000100020001710073039102";
