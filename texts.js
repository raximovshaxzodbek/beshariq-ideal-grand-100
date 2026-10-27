// Bot matnlari. Matnni o'zgartirish uchun faqat shu faylni tahrirlang.
import * as config from "./config.js";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul",
  "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export function uzDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}-${MONTHS[m - 1]}`;
}

const D = uzDate(config.REGISTRATION_DEADLINE);
const T = uzDate(config.TEST_DATE);

// --- Menyu tugmalari ---
export const BTN_REGISTER = "📝 Ro'yxatdan o'tish";
export const BTN_ABOUT = "🎓 Grant haqida";
export const BTN_ADDRESS = "📍 Manzil";
export const BTN_CONTACT = "📞 Aloqa";
export const BTN_MY = "📋 Mening arizalarim";
export const BTN_SEND_PHONE = "📱 Raqamni yuborish";
export const BTN_CANCEL = "❌ Bekor qilish";

export const WELCOME =
  `Assalomu alaykum! <b>${config.SCHOOL_NAME}</b> botiga xush kelibsiz.\n\n` +
  `🎓 <b>IDEAL GRANT 2026</b> — 1–10-sinf o'quvchilari uchun <b>100 ta grant</b>:\n` +
  `🥇 20 ta — <b>50%</b>\n` +
  `🥈 30 ta — <b>30%</b>\n` +
  `🥉 50 ta — <b>20%</b>\n\n` +
  `✅ Grant testi <b>BEPUL</b> — ${T}.\n` +
  `⏳ Ro'yxatdan o'tish ${D}gacha.\n\n` +
  `Farzandingizni testga yozish uchun «${BTN_REGISTER}» tugmasini bosing 👇`;

export const ABOUT =
  `🎓 <b>IDEAL GRANT 2026 haqida</b>\n\n` +
  `Grantlar bepul test natijasiga ko'ra beriladi. Jami 100 ta grant:\n` +
  `• 20 ta — oylik to'lovning 50%\n` +
  `• 30 ta — oylik to'lovning 30%\n` +
  `• 50 ta — oylik to'lovning 20%\n\n` +
  `<b>Test fanlari:</b>\n` +
  `• 1-sinf — savod, sanash, mantiq (og'zaki)\n` +
  `• 2–4-sinf — matematika, ona tili, mantiq\n` +
  `• 5–7-sinf — matematika, ona tili, ingliz tili\n` +
  `• 8–10-sinf — tanlangan yo'nalishning 2 ta fani\n\n` +
  `<b>Muhim:</b>\n` +
  `• Grant oylik ta'lim to'loviga beriladi va o'quv yili oxirigacha amal qiladi.\n` +
  `• Grant olish uchun testdan kamida 60% ball kerak.\n` +
  `• Grant yutmasangiz ham, farzandingiz bilim darajasi bo'yicha bepul tahlil oladi.\n\n` +
  `📅 Test: <b>${T}</b>\n` +
  `⏳ Ro'yxat: <b>${D}gacha</b>`;

export const ADDRESS =
  `📍 <b>Manzil:</b> ${config.SCHOOL_ADDRESS}\n` +
  `🧭 <b>Mo'ljal:</b> ${config.SCHOOL_LANDMARK}`;

export const CONTACT =
  `📞 <b>Aloqa</b>\n${config.SCHOOL_PHONES.join("\n")}\n\nTelegram: ${config.SCHOOL_TELEGRAM}`;

export const REGISTRATION_CLOSED =
  `Grant testiga ro'yxatdan o'tish yakunlandi. Savollar bo'lsa, qo'ng'iroq qiling:\n` +
  config.SCHOOL_PHONES.join("\n");

// --- Ro'yxatdan o'tish savollari ---
export const Q_PARENT = "1/8. Ismingiz va familiyangizni yozing (ota-ona):";
export const Q_PHONE =
  "2/8. Telefon raqamingizni yuboring.\n" +
  `«${BTN_SEND_PHONE}» tugmasini bosing yoki raqamni yozing (masalan: 90 123 45 67).`;
export const Q_CHILD = "3/8. Farzandingizning ismi va familiyasi:";
export const Q_GRADE = "4/8. Farzandingiz qaysi sinfga o'qishga kiradi?";
export const Q_DIRECTION = "5/8. Qaysi yo'nalishda o'qimoqchi?";
export const Q_LANG = "6/8. Qaysi tilda o'qiydi?";
export const Q_DORM = "7/8. Yotoqxona kerakmi?";
export const Q_HEARD = "8/8. Biz haqimizda qayerdan eshitdingiz?";

export const ERR_NAME = "Iltimos, ismni to'g'ri yozing (2–60 ta harf).";
export const ERR_PHONE = "Raqam noto'g'ri. Masalan: 90 123 45 67 yoki +998 90 123 45 67";
export const ERR_BUTTON = "Iltimos, pastdagi tugmalardan birini tanlang 👇";

export function confirm(d) {
  return (
    "Ma'lumotlarni tekshiring:\n\n" +
    `👤 Ota-ona: <b>${d.parentName}</b>\n` +
    `📱 Telefon: <b>${d.phone}</b>\n` +
    `🧒 Farzand: <b>${d.childName}</b>\n` +
    `🏫 Sinf: <b>${d.grade}-sinf</b>` +
    (d.direction ? `\n🧭 Yo'nalish: <b>${d.direction}</b>` : "") + "\n" +
    `🗣 Sinf tili: <b>${d.classLang}</b>\n` +
    `🛏 Yotoqxona: <b>${d.dormitory}</b>\n` +
    `📣 Qayerdan eshitgan: <b>${d.heardFrom}</b>\n\n` +
    "Hammasi to'g'rimi?"
  );
}

export function done(childName, testTime) {
  return (
    `🎉 <b>Tabriklaymiz! ${childName} grant testiga yozildi.</b>\n\n` +
    `📅 Test: <b>${T}, soat ${testTime}</b>\n` +
    `📍 ${config.SCHOOL_ADDRESS}\n` +
    `🧭 Mo'ljal: ${config.SCHOOL_LANDMARK}\n\n` +
    "Testdan bir kun oldin va test kuni ertalab eslatma yuboramiz. " +
    "Tez orada mutaxassisimiz siz bilan bog'lanadi.\n\n" +
    "Testga farzandingiz bilan birga keling: siz uchun maktab haqida taqdimot va " +
    "maktab bo'ylab sayr bo'ladi."
  );
}

export const CANCELLED = "Ro'yxatdan o'tish bekor qilindi. Istalgan vaqtda qaytadan boshlashingiz mumkin.";
export const NO_REGISTRATIONS = `Hali ro'yxatdan o'tmagansiz. «${BTN_REGISTER}» tugmasini bosing.`;
export const MORE_CHILDREN = "Yana farzandingiz bormi?";

// --- Eslatmalar ({children} o'rniga farzandlar ro'yxati qo'yiladi) ---
export const REMINDER_TEXTS = {
  deadline_3:
    "⏳ Grant testiga ro'yxat yopilishiga <b>3 kun</b> qoldi!\n\n" +
    "100 ta grantdan biri farzandingizniki bo'lishi mumkin: 50%, 30% yoki 20%. " +
    `Test bepul.\n\n«${BTN_REGISTER}» tugmasini bosing 👇`,
  deadline_1:
    "⏰ Ertaga grant testiga ro'yxat <b>yopiladi</b>.\n\n" +
    `Farzandingizni hoziroq yozdiring — bir daqiqa vaqt oladi. «${BTN_REGISTER}» 👇`,
  deadline_0:
    "🔔 <b>Bugun ro'yxatning oxirgi kuni!</b>\n\n" +
    `Ertaga, ${T}, grant testi bo'ladi. Ulgurib qoling: «${BTN_REGISTER}» 👇`,
  test_eve:
    "🔔 <b>Ertaga grant testi!</b>\n\n{children}\n\n" +
    `📍 ${config.SCHOOL_ADDRESS}\n🧭 Mo'ljal: ${config.SCHOOL_LANDMARK}\n\n` +
    "Farzandingiz qalam va ruchka olib kelsin. Testdan 15 daqiqa oldin keling.",
  test_morning:
    "☀️ <b>Bugun grant testi!</b>\n\n{children}\n\n" +
    `📍 ${config.SCHOOL_ADDRESS}\n🧭 Mo'ljal: ${config.SCHOOL_LANDMARK}\n\n` +
    "Sizni kutamiz! Omad tilaymiz 🍀",
};

// --- Admin ---
export const ADMIN_POST_AUDIENCE = "Postni kimlarga yuboramiz?";
export const ADMIN_POST_SEND =
  "Endi postni yuboring: matn, rasm, video yoki ovozli xabar (izohi bilan). Bekor qilish uchun /cancel";
export const adminPostPreview = (count) => `☝️ Post shunday ko'rinadi. ${count} kishiga yuboraymi?`;
export const ADMIN_POST_STARTED = "Yuborish boshlandi. Tugagach xabar beraman.";
export const adminPostDone = (ok, fail) =>
  `✅ Post yuborildi: ${ok} ta. Yetib bormadi: ${fail} ta (botni bloklagan).`;
