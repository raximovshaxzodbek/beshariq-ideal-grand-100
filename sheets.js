// Arizalarni Google Sheets jadvaliga yozish.
import fs from "node:fs";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import * as config from "./config.js";
import * as db from "./db.js";

export const HEADER = [
  "№", "Sana", "Ota-ona ismi", "Telefon", "Farzand ismi", "Sinf", "Yo'nalish",
  "Sinf tili", "Yotoqxona", "Qayerdan eshitgan", "Test vaqti",
  "Telegram", "Telegram ID", "Holat", "Izoh",
];

let sheet = null;
let syncing = false;

async function getSheet() {
  if (sheet) return sheet;
  const creds = JSON.parse(fs.readFileSync(config.GOOGLE_CREDENTIALS_FILE, "utf8"));
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const doc = new GoogleSpreadsheet(config.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  let ws = doc.sheetsByTitle[config.GOOGLE_WORKSHEET];
  if (!ws) {
    ws = await doc.addSheet({ title: config.GOOGLE_WORKSHEET, headerValues: HEADER,
      gridProperties: { frozenRowCount: 1 } });
  } else {
    try {
      await ws.loadHeaderRow();
    } catch {
      await ws.setHeaderRow(HEADER);
    }
  }
  sheet = ws;
  return sheet;
}

export function toRow(r) {
  return [
    r.id, r.created_at, r.parent_name, r.phone, r.child_name, `${r.grade}-sinf`,
    r.direction || "", r.class_lang, r.dormitory, r.heard_from,
    `${config.TEST_DATE.split("-").reverse().join(".")} ${r.test_time}`,
    r.username ? `@${r.username}` : "", String(r.user_id), "Yangi", "",
  ];
}

// Hali jadvalga tushmagan arizalarni yozadi. Nechtasi yozilganini qaytaradi.
export async function syncPending() {
  if (syncing) return 0;
  syncing = true;
  try {
    const pending = db.unsyncedRegistrations();
    if (!pending.length) return 0;
    const ws = await getSheet();
    await ws.addRows(pending.map(toRow), { raw: true });
    db.markSynced(pending.map((r) => r.id));
    return pending.length;
  } catch (e) {
    console.error("Google Sheets'ga yozib bo'lmadi, keyinroq qayta uriniladi:", e.message);
    sheet = null;
    return 0;
  } finally {
    syncing = false;
  }
}

// Internet yoki Google uzilib qolsa ham arizalar yo'qolmaydi: har daqiqada qayta urinadi.
export function startSyncLoop(intervalMs = 60_000) {
  return setInterval(syncPending, intervalMs);
}
