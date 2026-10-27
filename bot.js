// IDEAL GRANT 2026 — ro'yxatdan o'tish boti (Beshariq Ideal School)
import { Bot, GrammyError, InlineKeyboard, Keyboard, session } from "grammy";
import * as config from "./config.js";
import * as db from "./db.js";
import * as sheets from "./sheets.js";
import * as T from "./texts.js";

const DIRECTIONS = {
  tabiiy: "Tabiiy (kimyo, biologiya)",
  aniq: "Aniq (matematika, fizika)",
  ijtimoiy: "Ijtimoiy (tarix, huquq)",
  xorijiy: "Xorijiy (ingliz tili, ona tili)",
};
const LANGS = { uz: "O'zbek sinfi", ru: "Rus sinfi" };
const DORMS = { yes: "Ha, kerak", no: "Yo'q", maybe: "Hali bilmayman" };
const HEARD = {
  instagram: "Instagram", telegram: "Telegram", flayer: "Flayer",
  banner: "Banner", friends: "Tanishlardan", other: "Boshqa",
};
const AUDIENCES = {
  all: "Hammaga (start bosganlar)",
  registered: "Ro'yxatdan o'tganlarga",
  not_registered: "Ro'yxatdan o'tmaganlarga",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isAdmin = (id) => config.ADMIN_IDS.has(id);

export const bot = new Bot(config.BOT_TOKEN);

// Barcha matnli xabarlar HTML formatida
bot.api.config.use((prev, method, payload, signal) => {
  if ((method === "sendMessage" || method === "editMessageText") && !payload.parse_mode) {
    payload.parse_mode = "HTML";
  }
  return prev(method, payload, signal);
});

// Har bir foydalanuvchining joriy qadami: { step, data }
bot.use(session({ initial: () => ({ step: null, data: {} }) }));

// ---------- Klaviaturalar ----------

const mainMenu = () =>
  new Keyboard()
    .text(T.BTN_REGISTER).row()
    .text(T.BTN_ABOUT).text(T.BTN_ADDRESS).row()
    .text(T.BTN_CONTACT).text(T.BTN_MY)
    .resized();

const cancelKb = () => new Keyboard().text(T.BTN_CANCEL).resized();
const phoneKb = () => new Keyboard().requestContact(T.BTN_SEND_PHONE).row().text(T.BTN_CANCEL).resized();

function inline(prefix, options, perRow = 1) {
  const kb = new InlineKeyboard();
  Object.entries(options).forEach(([k, v], i) => {
    kb.text(v, `${prefix}:${k}`);
    if ((i + 1) % perRow === 0) kb.row();
  });
  return kb;
}

const gradeKb = () => {
  const o = {};
  for (let g = 1; g <= 10; g++) o[g] = `${g}-sinf`;
  return inline("grade", o, 5);
};

// ---------- Yordamchilar ----------

export function normalizePhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 9) digits = "998" + digits;
  return digits.length === 12 && digits.startsWith("998") ? `+${digits}` : null;
}

function validName(text) {
  if (!text) return null;
  const t = text.trim().replace(/\s+/g, " ");
  return t.length >= 2 && t.length <= 60 && !t.startsWith("/") ? t : null;
}

// Bitta xabar yuboradi. Bloklagan bo'lsa belgilaydi, limitga tushsa kutib qayta urinadi.
async function safeSend(fn, userId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fn();
      return true;
    } catch (e) {
      if (e instanceof GrammyError && e.error_code === 429) {
        await sleep(((e.parameters?.retry_after ?? 5) + 1) * 1000);
        continue;
      }
      if (e instanceof GrammyError && e.error_code === 403) {
        db.setBlocked(userId);
        return false;
      }
      console.warn(`Xabar yuborilmadi ${userId}:`, e.description || e.message);
      return false;
    }
  }
  return false;
}

// ---------- Buyruqlar ----------

bot.command("start", async (ctx) => {
  ctx.session = { step: null, data: {} };
  // Havoladagi manba: t.me/BOT?start=flayer -> "flayer"
  const source = (ctx.match || "").trim().slice(0, 32) || null;
  const u = ctx.from;
  db.addUser(u.id, u.username, [u.first_name, u.last_name].filter(Boolean).join(" "), source);
  await ctx.reply(T.WELCOME, { reply_markup: mainMenu() });
});

bot.command("cancel", cancel);
bot.hears(T.BTN_CANCEL, cancel);
async function cancel(ctx) {
  ctx.session = { step: null, data: {} };
  await ctx.reply(T.CANCELLED, { reply_markup: mainMenu() });
}

bot.command("stat", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const s = db.stats();
  const list = (rows, fmt) => rows.map(fmt).join("\n") || "  —";
  await ctx.reply(
    "📊 <b>Statistika</b>\n\n" +
    `Start bosganlar: <b>${s.users}</b> (bloklagan: ${s.blocked})\n` +
    `Arizalar: <b>${s.registrations}</b> (${s.families} ta oiladan)\n` +
    `Bugungi arizalar: <b>${s.today}</b>\n` +
    `Jadvalga tushmagan: ${s.unsynced}\n\n` +
    `<b>Sinflar bo'yicha:</b>\n${list(s.byGrade, (r) => `  ${r.k}-sinf: ${r.n}`)}\n\n` +
    `<b>Qayerdan eshitgan:</b>\n${list(s.bySource, (r) => `  ${r.k}: ${r.n}`)}\n\n` +
    `<b>Havola bo'yicha (start=...):</b>\n${list(s.byLink, (r) => `  ${esc(r.k)}: ${r.n}`)}`
  );
});

bot.command("sync", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const n = await sheets.syncPending();
  await ctx.reply(`Google Sheets'ga yozildi: ${n} ta ariza.`);
});

bot.command("post", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  ctx.session = { step: "post_audience", data: {} };
  await ctx.reply(T.ADMIN_POST_AUDIENCE, { reply_markup: inline("aud", AUDIENCES) });
});

// ---------- Menyu ----------

bot.hears(T.BTN_ABOUT, (ctx) => ctx.reply(T.ABOUT));
bot.hears(T.BTN_CONTACT, (ctx) => ctx.reply(T.CONTACT));
bot.hears(T.BTN_ADDRESS, async (ctx) => {
  if (config.SCHOOL_LAT !== null && config.SCHOOL_LON !== null) {
    await ctx.replyWithVenue(config.SCHOOL_LAT, config.SCHOOL_LON, config.SCHOOL_NAME, config.SCHOOL_ADDRESS);
  }
  await ctx.reply(T.ADDRESS);
});
bot.hears(T.BTN_MY, async (ctx) => {
  const regs = db.registrationsOf(ctx.from.id);
  if (!regs.length) return ctx.reply(T.NO_REGISTRATIONS);
  const lines = regs.map((r) =>
    `🧒 <b>${esc(r.child_name)}</b> — ${r.grade}-sinf, test: ${T.uzDate(config.TEST_DATE)}, soat ${r.test_time}`);
  await ctx.reply("📋 <b>Arizalaringiz:</b>\n\n" + lines.join("\n"));
});
bot.hears(T.BTN_REGISTER, beginRegistration);

async function beginRegistration(ctx) {
  if (!config.registrationOpen()) {
    ctx.session = { step: null, data: {} };
    return ctx.reply(T.REGISTRATION_CLOSED, { reply_markup: mainMenu() });
  }
  ctx.session = { step: "parent_name", data: {} };
  await ctx.reply(T.Q_PARENT, { reply_markup: cancelKb() });
}

// ---------- Ro'yxatdan o'tish: matnli javoblar ----------

bot.on("message", async (ctx, next) => {
  const { step, data } = ctx.session;
  const text = ctx.message.text;

  if (step === "parent_name") {
    const name = validName(text);
    if (!name) return ctx.reply(T.ERR_NAME);
    data.parentName = name;
    ctx.session.step = "phone";
    return ctx.reply(T.Q_PHONE, { reply_markup: phoneKb() });
  }

  if (step === "phone") {
    const phone = normalizePhone(ctx.message.contact ? ctx.message.contact.phone_number : text);
    if (!phone) return ctx.reply(T.ERR_PHONE, { reply_markup: phoneKb() });
    data.phone = phone;
    ctx.session.step = "child_name";
    return ctx.reply(T.Q_CHILD, { reply_markup: cancelKb() });
  }

  if (step === "child_name") {
    const name = validName(text);
    if (!name) return ctx.reply(T.ERR_NAME);
    data.childName = name;
    ctx.session.step = "grade";
    return ctx.reply(T.Q_GRADE, { reply_markup: gradeKb() });
  }

  if (step === "post_content" && isAdmin(ctx.from.id)) {
    const users = db.audience(data.audience);
    data.chatId = ctx.chat.id;
    data.messageId = ctx.message.message_id;
    ctx.session.step = "post_confirm";
    await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, ctx.message.message_id);
    return ctx.reply(T.adminPostPreview(users.length), {
      reply_markup: inline("post", { send: "📤 Yuborish", cancel: "❌ Bekor qilish" }, 2),
    });
  }

  // Tugma kutilayotgan paytda matn yozilsa
  if (["grade", "direction", "class_lang", "dormitory", "heard_from", "confirm"].includes(step)) {
    return ctx.reply(T.ERR_BUTTON);
  }
  return next();
});

// ---------- Ro'yxatdan o'tish: tugmalar ----------

bot.on("callback_query:data", async (ctx) => {
  const [prefix, value] = ctx.callbackQuery.data.split(":");
  const { step, data } = ctx.session;
  await ctx.answerCallbackQuery();

  // Javob tanlangach savol ostida belgilab qo'yiladi va tugmalar olib tashlanadi
  const mark = (question, answer) => ctx.editMessageText(`${question}\n✅ ${answer}`).catch(() => {});

  if (prefix === "grade" && step === "grade") {
    const grade = Number(value);
    if (!(grade >= 1 && grade <= 10)) return;
    await mark(T.Q_GRADE, `${grade}-sinf`);
    data.grade = grade;
    data.testTime = config.testTimeForGrade(grade);
    if (grade >= 8) {
      ctx.session.step = "direction";
      return ctx.reply(T.Q_DIRECTION, { reply_markup: inline("dir", DIRECTIONS) });
    }
    data.direction = null;
    ctx.session.step = "class_lang";
    return ctx.reply(T.Q_LANG, { reply_markup: inline("lang", LANGS, 2) });
  }

  if (prefix === "dir" && step === "direction" && DIRECTIONS[value]) {
    await mark(T.Q_DIRECTION, DIRECTIONS[value]);
    data.direction = DIRECTIONS[value];
    ctx.session.step = "class_lang";
    return ctx.reply(T.Q_LANG, { reply_markup: inline("lang", LANGS, 2) });
  }

  if (prefix === "lang" && step === "class_lang" && LANGS[value]) {
    await mark(T.Q_LANG, LANGS[value]);
    data.classLang = LANGS[value];
    ctx.session.step = "dormitory";
    return ctx.reply(T.Q_DORM, { reply_markup: inline("dorm", DORMS, 3) });
  }

  if (prefix === "dorm" && step === "dormitory" && DORMS[value]) {
    await mark(T.Q_DORM, DORMS[value]);
    data.dormitory = DORMS[value];
    ctx.session.step = "heard_from";
    return ctx.reply(T.Q_HEARD, { reply_markup: inline("heard", HEARD, 2) });
  }

  if (prefix === "heard" && step === "heard_from" && HEARD[value]) {
    await mark(T.Q_HEARD, HEARD[value]);
    data.heardFrom = HEARD[value];
    ctx.session.step = "confirm";
    return ctx.reply(
      T.confirm({ ...data, parentName: esc(data.parentName), childName: esc(data.childName) }),
      { reply_markup: inline("confirm", { yes: "✅ Tasdiqlash", edit: "✏️ Qaytadan to'ldirish" }) }
    );
  }

  if (prefix === "confirm" && step === "confirm") {
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => {});
    if (value === "edit") return beginRegistration(ctx);
    db.addRegistration(ctx.from.id, data);
    ctx.session = { step: null, data: {} };
    sheets.syncPending(); // fonda, javobni kutib o'tirmaydi
    await ctx.reply(T.done(esc(data.childName), data.testTime), { reply_markup: mainMenu() });
    return ctx.reply(T.MORE_CHILDREN, {
      reply_markup: inline("again", { yes: "➕ Yana bir farzandni yozish" }),
    });
  }

  if (prefix === "again") {
    if (!config.registrationOpen()) {
      return ctx.reply(T.REGISTRATION_CLOSED, { reply_markup: mainMenu() });
    }
    // Ota-ona ismi va telefoni oldingi arizadan olinadi
    const regs = db.registrationsOf(ctx.from.id);
    if (!regs.length) return beginRegistration(ctx);
    const last = regs[regs.length - 1];
    ctx.session = { step: "child_name", data: { parentName: last.parent_name, phone: last.phone } };
    return ctx.reply(T.Q_CHILD, { reply_markup: cancelKb() });
  }

  // ---------- Admin: post ----------
  if (!isAdmin(ctx.from.id)) return;

  if (prefix === "aud" && step === "post_audience" && AUDIENCES[value]) {
    await mark(T.ADMIN_POST_AUDIENCE, AUDIENCES[value]);
    ctx.session = { step: "post_content", data: { audience: value } };
    return ctx.reply(T.ADMIN_POST_SEND);
  }

  if (prefix === "post" && step === "post_confirm") {
    ctx.session = { step: null, data: {} };
    if (value === "cancel") return ctx.editMessageText("Post bekor qilindi.").catch(() => {});
    await ctx.editMessageText(T.ADMIN_POST_STARTED).catch(() => {});
    broadcast(ctx.from.id, data.audience, data.chatId, data.messageId); // fonda ishlaydi
  }
});

export async function broadcast(adminId, kind, fromChat, messageId) {
  let ok = 0;
  let fail = 0;
  for (const uid of db.audience(kind)) {
    (await safeSend(() => bot.api.copyMessage(uid, fromChat, messageId), uid)) ? ok++ : fail++;
    await sleep(50); // Telegram limiti: sekundiga ~20 ta xabar
  }
  await bot.api.sendMessage(adminId, T.adminPostDone(ok, fail));
}

// ---------- Avtomatik eslatmalar ----------

function reminderText(key, userId) {
  const text = T.REMINDER_TEXTS[key];
  if (!text.includes("{children}")) return text;
  const children = db.registrationsOf(userId)
    .map((r) => `🧒 ${esc(r.child_name)} (${r.grade}-sinf) — soat <b>${r.test_time}</b>`)
    .join("\n");
  return text.replace("{children}", children);
}

let reminderRunning = false;
export async function checkReminders(now = Date.now()) {
  if (reminderRunning) return;
  reminderRunning = true;
  try {
    for (const r of config.REMINDERS) {
      const start = config.localToMs(r.date, r.time);
      if (!(now >= start && now < start + config.REMINDER_GRACE_HOURS * 3600e3)) continue;
      const markup = r.audience === "not_registered" ? mainMenu() : undefined;
      for (const uid of db.audience(r.audience)) {
        if (db.reminderWasSent(r.key, uid)) continue;
        const text = reminderText(r.key, uid);
        await safeSend(() => bot.api.sendMessage(uid, text, markup ? { reply_markup: markup } : {}), uid);
        db.markReminderSent(r.key, uid);
        await sleep(50);
      }
    }
  } finally {
    reminderRunning = false;
  }
}

// ---------- Ishga tushirish ----------

bot.catch((err) => console.error("Xatolik:", err.error?.description || err.error || err));

if (process.env.NODE_ENV !== "test") {
  setInterval(checkReminders, 60_000);
  sheets.startSyncLoop();
  bot.start({ onStart: (info) => console.log(`Bot ishga tushdi: @${info.username}`) });
}
