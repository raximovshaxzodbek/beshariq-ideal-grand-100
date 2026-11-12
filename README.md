# IDEAL GRANT 2026 — ro'yxatdan o'tish boti (Node.js)

Beshariq Ideal School grant testi uchun Telegram bot. Node.js 22.13 yoki undan yangi versiya kerak (Windows, Linux, macOS — hammasida ishlaydi, hech narsa kompilyatsiya qilinmaydi).

## Bot nima qiladi

**Ota-onalar uchun**
- 9 ta savol orqali farzandni grant testiga yozadi: ota-ona ismi, telefon, farzand ismi, tahsil olayotgan maktab, sinf (1–10), yo'nalish (faqat 8–10-sinf), sinf tili, yotoqxona, qayerdan eshitgan. Ideal School o'quvchilari grant testiga ro'yxatdan o'tolmaydi; boshqa maktab o'quvchilaridan maktab nomi so'raladi.
- Bitta ota-ona bir nechta farzandini yozishi mumkin (ismi va telefoni qayta so'ralmaydi).
- Har bir farzandga sinfiga qarab test vaqtini aytadi: 1–4-sinf 09:00, 5–7-sinf 11:30, 8–10-sinf 14:00.
- Menyu: Grant haqida, Manzil, Aloqa, Mening arizalarim.
- Ro'yxatdan o'tish 28-noyabr kuni yakunlanadi.

**Arizalar** Google Sheets jadvaliga tushadi. Internet yoki Google uzilib qolsa, ariza botning o'z bazasida saqlanadi va har daqiqada qayta yuboriladi — hech biri yo'qolmaydi. Jadvaldagi "№" ariza yozuvlari soniga qarab ketma-ket beriladi; jadvaldagi avvalgi qatorlar avtomatik qayta raqamlanmaydi. Jadvalda "Holat" va "Izoh" ustunlari bor: qabul bo'limi qo'ng'iroq natijasini shu yerga yozadi.

**Avtomatik eslatmalar**
| Qachon | Kimga |
| --- | --- |
| 25-noyabr 10:00 — "3 kun qoldi" | Start bosib, ro'yxatdan o'tmaganlar |
| 27-noyabr 10:00 — "Ertaga yopiladi" | Ro'yxatdan o'tmaganlar |
| 28-noyabr 09:00 — "Bugun oxirgi kun" | Ro'yxatdan o'tmaganlar |
| 28-noyabr 18:00 — "Ertaga test" + vaqti | Ro'yxatdan o'tganlar |
| 29-noyabr 07:00 — "Bugun test" | Ro'yxatdan o'tganlar |

Har bir eslatma bir kishiga faqat bir marta boradi, bot qayta ishga tushsa ham.

**Admin buyruqlari** (faqat `ADMIN_IDS` dagi odamlar uchun)
- `/post` — post tarqatish. Kimga yuborishni tanlaysiz (hammaga / ro'yxatdan o'tganlarga / o'tmaganlarga), postni yuborasiz (matn, rasm yoki video izohi bilan), bot ko'rinishini ko'rsatadi, tasdiqlasangiz yuboradi va oxirida nechta odamga yetganini aytadi.
- `/stat` — statistika: start bosganlar, arizalar, sinflar va manbalar bo'yicha.
- `/sync` — jadvalga darhol yozish.
- `/restore_users` — Google Sheets'dagi `Telegram ID` ustunidan foydalanuvchilarni bot bazasiga tiklash. Tiklagandan keyin hammaga xabar yuborish uchun `/post`da “Hammaga (start bosganlar)”ni tanlang. Bu buyruq faqat ID'larni tiklaydi; “ro'yxatdan o'tganlar” auditoriyasi uchun ariza ma'lumotlari bot bazasida ham bo'lishi kerak.

> Albom (bir nechta rasm birga) yuborib bo'lmaydi — bitta rasm yoki video izohi bilan yuboring.

## Reklama manbasini kuzatish

Har bir reklama kanali uchun alohida havola bering:

- Flayer QR kodi: `https://t.me/BOT_NOMI?start=flayer`
- Banner QR kodi: `https://t.me/BOT_NOMI?start=banner`
- Instagram reklama: `https://t.me/BOT_NOMI?start=insta`
- Telegram kanal: `https://t.me/BOT_NOMI?start=tgkanal`

`/stat` da qaysi havoladan nechta odam kelgani ko'rinadi.

## O'rnatish

### 1. Bot yaratish
1. @BotFather'da `/newbot` → nom va username bering.
2. Tokenni saqlang (hech kimga bermang).
3. Admin ID: @userinfobot'ga yozing, u sizning ID raqamingizni beradi.

### 2. Google Sheets
1. [console.cloud.google.com](https://console.cloud.google.com) → yangi loyiha.
2. **APIs & Services → Library** → **Google Sheets API** ni yoqing.
3. **Credentials → Create credentials → Service account** → yarating.
4. Service account → **Keys → Add key → JSON** → fayl yuklanadi. Uni `credentials.json` deb nomlang.
5. Google'da yangi jadval oching. **Share** tugmasi orqali service account emailiga (`...@...iam.gserviceaccount.com`) **Editor** huquqini bering.
6. Jadval havolasidan ID ni oling: `docs.google.com/spreadsheets/d/<ID>/edit`.

Bot birinchi arizada "Arizalar" varag'ini va sarlavhalarni o'zi yaratadi.
`GOOGLE_CREDENTIALS_FILE` nisbiy yo'l bo'lsa, loyiha papkasidan qidiriladi; mutlaq yo'l ham berish mumkin.

### Railway'da Google credentials sozlash
`credentials.json` faylini GitHub'ga yuklamang. Railway loyihasidagi bot service'ni oching → **Variables** → **New Variable**:

- **Name:** `GOOGLE_CREDENTIALS_JSON`
- **Value:** `credentials.json` faylining to'liq JSON mazmuni

Saqlang va Railway'da o'zgarishlarni deploy qiling. Bu variable berilgan bo'lsa, u `GOOGLE_CREDENTIALS_FILE` fayl yo'lidan ustun turadi. Google service account emailiga jadvalda **Editor** ruxsati berilgan bo'lishi, `GOOGLE_SHEET_ID` esa to'g'ri bo'lishi kerak.

### Railway'da bot bazasini saqlash va tiklash
Railway'da bot service'ga **Volume** ulang va mount path'ni `/data` qilib belgilang. Variables'ga `DB_PATH=/data/bot.db` qo'shing, so'ng deploy qiling. Bu botning SQLite bazasini qayta deploylarda saqlaydi.

Bot ishga tushgach, admin sifatida `/restore_users` yuboring. Buyruq Google Sheets'dagi noyob Telegram ID'larni import qiladi va nechta oluvchiga xabar yuborish mumkinligini ko'rsatadi. Keyin `/post` → “Hammaga (start bosganlar)” orqali tarqating. Google service account jadvalga kirish huquqiga ega ekanini tekshiring.

### 3. Server (Ubuntu VPS, eng arzon tarif yetadi: 1 CPU, 1 GB RAM)
```bash
# Node.js 22 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# bot fayllarini va credentials.json ni /opt/ideal-grant-bot ga yuklang
cd /opt/ideal-grant-bot
npm install
cp .env.example .env
nano .env          # BOT_TOKEN, ADMIN_IDS, GOOGLE_SHEET_ID ni yozing

# sinov uchun ishga tushirish (Ctrl+C bilan to'xtatiladi)
npm start

# doimiy ishlashi uchun (pm2)
sudo npm install -g pm2
pm2 start npm --name ideal-grant -- start
pm2 save
pm2 startup        # chiqqan buyruqni nusxalab ishga tushiring — server o'chib-yonsa ham bot ishlaydi

pm2 logs ideal-grant      # loglarni ko'rish
pm2 restart ideal-grant   # .env yoki matn o'zgargandan keyin
```

## Sozlamalarni o'zgartirish
- Sanalar va test vaqtlari — `.env` faylida, keyin `pm2 restart ideal-grant`.
- Bot matnlari — `texts.js` faylida.
- Eslatmalar vaqti — `config.js` dagi `REMINDERS` ro'yxatida.

## Fayllar
| Fayl | Vazifasi |
| --- | --- |
| `bot.js` | Asosiy bot: savollar, menyu, admin buyruqlari, eslatmalar |
| `texts.js` | Barcha matnlar |
| `config.js` | Sozlamalar |
| `db.js` | Node.js ichidagi SQLite baza (`bot.db`) |
| `sheets.js` | Google Sheets bilan ishlash |

`bot.db` faylini o'chirmang: unda start bosganlar ro'yxati saqlanadi, postlar shu ro'yxatga yuboriladi.
# beshariq-ideal-grand-100
