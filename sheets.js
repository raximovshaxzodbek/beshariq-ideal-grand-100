// Arizalarni Google Sheets jadvaliga yozish.
import fs from "node:fs";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import * as config from "./config.js";
import * as db from "./db.js";

export const HEADER = [
  "№", "Sana", "Ota-ona ismi", "Telefon", "Farzand ismi", "Sinf", "Yo'nalish",
  "Sinf tili", "Yotoqxona", "Qayerdan eshitgan", "Test vaqti",
  "Telegram", "Telegram ID", "Holat", "Izoh", "Maktabi",
];

let sheet = null;
let syncing = false;

async function getSheet() {
  if (sheet) return sheet;
  const creds = config.GOOGLE_CREDENTIALS_JSON
    ? JSON.parse(config.GOOGLE_CREDENTIALS_JSON)
    : JSON.parse(fs.readFileSync(config.GOOGLE_CREDENTIALS_FILE, "utf8"));
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
      if (!ws.headerValues.includes("Maktabi")) {
        await ws.setHeaderRow([...ws.headerValues, "Maktabi"]);
      }
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
    r.username ? `@${r.username}` : "", String(r.user_id), "Yangi", "", r.current_school,
  ];
}

export async function usersFromSheet() {
  const ws = await getSheet();
  await ws.loadHeaderRow();
  if (!ws.headerValues.includes("Telegram ID")) {
    throw new Error('Google Sheets jadvalida "Telegram ID" ustuni topilmadi.');
  }

  const rows = await ws.getRows();
  const users = new Map();
  let invalidRows = 0;
  for (const row of rows) {
    const rawId = row.get("Telegram ID");
    if (rawId === undefined || rawId === null || String(rawId).trim() === "") continue;
    const value = String(rawId).trim();
    if (!/^\d+$/.test(value)) {
      invalidRows++;
      continue;
    }
    const userId = Number(value);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      invalidRows++;
      continue;
    }
    const previous = users.get(userId);
    const username = String(row.get("Telegram") ?? "").trim().replace(/^@/, "");
    const fullName = String(row.get("Ota-ona ismi") ?? "").trim();
    users.set(userId, {
      userId,
      username: username || previous?.username || null,
      fullName: fullName || previous?.fullName || null,
    });
  }
  return { users: [...users.values()], invalidRows, rows: rows.length };
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
