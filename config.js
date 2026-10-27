// Bot sozlamalari. Hammasi .env faylidan o'qiladi.
import "dotenv/config";

function required(name) {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`.env faylida ${name} ko'rsatilmagan`);
  return value;
}

export const BOT_TOKEN = required("BOT_TOKEN");

// Post yubora oladigan va statistikani ko'ra oladigan adminlar (Telegram ID, vergul bilan)
export const ADMIN_IDS = new Set(
  (process.env.ADMIN_IDS || "").split(",").map((x) => x.trim()).filter(Boolean).map(Number)
);

export const GOOGLE_SHEET_ID = required("GOOGLE_SHEET_ID");
export const GOOGLE_CREDENTIALS_FILE = process.env.GOOGLE_CREDENTIALS_FILE || "credentials.json";
export const GOOGLE_WORKSHEET = process.env.GOOGLE_WORKSHEET || "Arizalar";

export const DB_PATH = process.env.DB_PATH || "bot.db";

// Toshkent vaqti: UTC+5 (yozgi vaqt yo'q)
export const TZ_OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS || 5);

// Kampaniya sanalari (YYYY-MM-DD)
export const REGISTRATION_DEADLINE = process.env.REGISTRATION_DEADLINE || "2026-11-25";
export const TEST_DATE = process.env.TEST_DATE || "2026-11-26";

// Sinflar bo'yicha test vaqti
export function testTimeForGrade(grade) {
  if (grade <= 4) return process.env.TEST_TIME_1_4 || "09:00";
  if (grade <= 7) return process.env.TEST_TIME_5_7 || "11:30";
  return process.env.TEST_TIME_8_10 || "14:00";
}

// Maktab ma'lumotlari
export const SCHOOL_NAME = "Beshariq Ideal School";
export const SCHOOL_ADDRESS =
  "Farg'ona viloyati, Beshariq tumani, Hamid Olimjon MFY, Sirdaryo ko'chasi, 129-uy";
export const SCHOOL_LANDMARK = "Davr to'yxonasi va Family Park ro'parasi";
export const SCHOOL_PHONES = ["+998 88 730 00 40", "+998 88 733 00 40"];
export const SCHOOL_TELEGRAM = "@BESHARIQ_IDEAL_SCHOOL";

// Xaritadagi nuqta (ixtiyoriy). Bo'lsa, bot lokatsiya yuboradi.
export const SCHOOL_LAT = process.env.SCHOOL_LAT ? Number(process.env.SCHOOL_LAT) : null;
export const SCHOOL_LON = process.env.SCHOOL_LON ? Number(process.env.SCHOOL_LON) : null;

// ---------- Vaqt bilan ishlash ----------

// Hozirgi Toshkent vaqti: "2026-11-25 18:05:00"
export function nowLocal() {
  return new Date(Date.now() + TZ_OFFSET_HOURS * 3600e3).toISOString().replace("T", " ").slice(0, 19);
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Toshkent vaqtidagi sana va soatni millisekundga aylantiradi
export function localToMs(isoDate, hhmm) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - TZ_OFFSET_HOURS * 3600e3;
}

export function registrationOpen() {
  return nowLocal().slice(0, 10) <= REGISTRATION_DEADLINE;
}

// Eslatmalar: kalit, sana, vaqt, kimga
// kimga: "registered" — ro'yxatdan o'tganlar, "not_registered" — start bosib o'tmaganlar
export const REMINDERS = [
  { key: "deadline_3", date: addDays(REGISTRATION_DEADLINE, -3), time: "10:00", audience: "not_registered" },
  { key: "deadline_1", date: addDays(REGISTRATION_DEADLINE, -1), time: "10:00", audience: "not_registered" },
  { key: "deadline_0", date: REGISTRATION_DEADLINE, time: "09:00", audience: "not_registered" },
  { key: "test_eve", date: addDays(TEST_DATE, -1), time: "18:00", audience: "registered" },
  { key: "test_morning", date: TEST_DATE, time: "07:00", audience: "registered" },
];
// Bot o'chiq turgan bo'lsa, eslatma vaqtidan keyin necha soat ichida baribir yuboriladi
export const REMINDER_GRACE_HOURS = 4;
