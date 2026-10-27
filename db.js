// SQLite baza: start bosganlar, arizalar va yuborilgan eslatmalar.
import { DatabaseSync } from "node:sqlite";
import * as config from "./config.js";

const db = new DatabaseSync(config.DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_id     INTEGER PRIMARY KEY,
  username    TEXT,
  full_name   TEXT,
  source      TEXT,
  started_at  TEXT NOT NULL,
  blocked     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS registrations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  parent_name  TEXT NOT NULL,
  phone        TEXT NOT NULL,
  child_name   TEXT NOT NULL,
  grade        INTEGER NOT NULL,
  direction    TEXT,
  class_lang   TEXT NOT NULL,
  dormitory    TEXT NOT NULL,
  heard_from   TEXT NOT NULL,
  test_time    TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  synced       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reminders_sent (
  key      TEXT NOT NULL,
  user_id  INTEGER NOT NULL,
  PRIMARY KEY (key, user_id)
);
`);

export function addUser(userId, username, fullName, source) {
  db.prepare(
    `INSERT INTO users (user_id, username, full_name, source, started_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username, full_name = excluded.full_name, blocked = 0`
  ).run(userId, username ?? null, fullName, source ?? null, config.nowLocal());
}

export function setBlocked(userId) {
  db.prepare("UPDATE users SET blocked = 1 WHERE user_id = ?").run(userId);
}

export function addRegistration(userId, d) {
  return db.prepare(
    `INSERT INTO registrations
     (user_id, parent_name, phone, child_name, grade, direction,
      class_lang, dormitory, heard_from, test_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, d.parentName, d.phone, d.childName, d.grade, d.direction ?? null,
    d.classLang, d.dormitory, d.heardFrom, d.testTime, config.nowLocal()).lastInsertRowid;
}

export function unsyncedRegistrations() {
  return db.prepare(
    `SELECT r.*, u.username FROM registrations r
     LEFT JOIN users u ON u.user_id = r.user_id
     WHERE r.synced = 0 ORDER BY r.id`
  ).all();
}

export function markSynced(ids) {
  const stmt = db.prepare("UPDATE registrations SET synced = 1 WHERE id = ?");
  db.exec("BEGIN");
  try {
    ids.forEach((id) => stmt.run(id));
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function registrationsOf(userId) {
  return db.prepare("SELECT * FROM registrations WHERE user_id = ? ORDER BY id").all(userId);
}

// kind: all | registered | not_registered. Botni bloklaganlar kirmaydi.
export function audience(kind) {
  const q = {
    all: "SELECT user_id FROM users WHERE blocked = 0",
    registered: `SELECT user_id FROM users WHERE blocked = 0
                 AND user_id IN (SELECT user_id FROM registrations)`,
    not_registered: `SELECT user_id FROM users WHERE blocked = 0
                     AND user_id NOT IN (SELECT user_id FROM registrations)`,
  }[kind];
  return db.prepare(q).all().map((r) => r.user_id);
}

export function reminderWasSent(key, userId) {
  return !!db.prepare("SELECT 1 FROM reminders_sent WHERE key = ? AND user_id = ?").get(key, userId);
}

export function markReminderSent(key, userId) {
  db.prepare("INSERT OR IGNORE INTO reminders_sent (key, user_id) VALUES (?, ?)").run(key, userId);
}

export function stats() {
  const one = (q, ...a) => Object.values(db.prepare(q).get(...a))[0];
  return {
    users: one("SELECT COUNT(*) FROM users"),
    blocked: one("SELECT COUNT(*) FROM users WHERE blocked = 1"),
    registrations: one("SELECT COUNT(*) FROM registrations"),
    families: one("SELECT COUNT(DISTINCT user_id) FROM registrations"),
    today: one("SELECT COUNT(*) FROM registrations WHERE created_at LIKE ?", config.nowLocal().slice(0, 10) + "%"),
    unsynced: one("SELECT COUNT(*) FROM registrations WHERE synced = 0"),
    byGrade: db.prepare("SELECT grade AS k, COUNT(*) AS n FROM registrations GROUP BY grade ORDER BY grade").all(),
    bySource: db.prepare("SELECT heard_from AS k, COUNT(*) AS n FROM registrations GROUP BY heard_from ORDER BY n DESC").all(),
    byLink: db.prepare("SELECT source AS k, COUNT(*) AS n FROM users WHERE source IS NOT NULL GROUP BY source ORDER BY n DESC").all(),
  };
}
