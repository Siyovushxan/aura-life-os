AURA: AI-Powered Life Operating System PRD v2.1

**⚠️ VERSIYA YANGILANDI: v2.0 → v2.1**
Ushbu yangilash joriy web implementatsiyasini to'liq hujjatlashtiradi va backend/mobile holatlari aniq belgilaydi.

--------------------------------------------------------------------------------
AURA — MAHSULOT TALABLARI HUJJATI (PRD v2.3)

**Loyiha Nomi:** AURA (AI-Powered Life Operating System)  
**Versiya:** 2.6 (Verification & Polish Phase)  
**Holat:** Web Platform - ✅ Production Ready (System Verified) | Backend & Mobile - 🚧 Pending  
**Platformalar:** Web Dashboard (100%), iOS/Android Mobile App (Planned)  
**Muallif:** Siyovush Abdullayev  
**Oxirgi Yangilanish:** 2026-01-26

--------------------------------------------------------------------------------

## 1. LOYIHA TAVSIFI VA FALSAFASI (PROJECT OVERVIEW)

AURA — bu insonning kundalik hayotini har tomonlama (moliya, salomatlik, ruhiyat, fokus, oila) tartibga soluvchi va GROQ AI (Sun'iy Intellekt) yordamida aqlli tahlillar beruvchi shaxsiy yordamchi tizimdir.

**Yangi Falsafa:** Loyiha shunchaki "Tracker" emas, balki **"Life OS"** (Hayotni Boshqarish Tizimi). U **"Kapalak Effekti"** tamoyili asosida ishlaydi: Moliya, Sog'liq va Ruhiyat bir-biriga qanday ta'sir qilishini aniqlaydi va vizualizatsiya qiladi.

**Web Platform Mission:** "The Brain" - Chuqur tahlil, strategik rejalashtirish va ma'lumotlarni boshqarish markazi.

--------------------------------------------------------------------------------

## 2. MAHALLIYLASHTIRISH (LOCALIZATION)

## ✅ IMPLEMENTATSIYA HOLATI: To'liq amalga oshirilgan**

### 2.1. Qo'llab-quvvatlanadigan Tillar

• **Ingliz (English)** - Asosiy til
• **O'zbek (Uzbek)** - To'liq qo'llab-quvvatlash
• **Rus (Russian)** - To'liq qo'llab-quvvatlash

### 2.2. Texnik Implementatsiya

• **LanguageContext:** React Context API yordamida global til boshqaruvi
• **Dynamic Switching:** Real vaqtda til o'zgartirish (sahifa yangilanishi shart emas)
• **Persistence:** Firebase user profile da `language` maydoni saqlanadi
• **Translation Keys:** Barcha UI matnlar strukturalashtirilgan kalitlar orqali tartibga solingan

### 2.3. Qamrov

Barcha modullar va komponentlar uchun:

- Interfeys matnlari
- Placeholder'lar
- Xatolik xabarlari
- Bildirishnomalar
- AI javoblari (kelajakda)

**Mantiq:** Foydalanuvchi birinchi kirganida yoki sozlamalarda tilni tanlaydi. Tanlangan til barcha sessiylarda saqlanadi.

--------------------------------------------------------------------------------

## 3. UI/UX DIZAYN KONSEPTSIYASI

### 3.1. Mobil Ilova: "The Soul" 🚧 PENDING

*(Hissiy va Minimalistik)*

• **Maqsad:** Tezkor kirish, hissiy bog'liqlik va kichik ekranlar uchun qulaylik.
• **Visual Style:** "Thumb-friendly" interfeys. Standart jadvallar o'rniga suyuq (fluid) animatsiyalar.
• **Bosh Ekran (Aura Sphere):** Foydalanuvchining 7 ta modul bo'yicha umumiy holatini ifodalovchi, rangini o'zgartirib turuvchi interaktiv "Aura Sferasi".
• **Adaptive UI:** Stress holatida ilova murakkab menyularni yashirib, tinchlantiruvchi rejimga o'tadi.

### 3.2. Web Dashboard: "The Brain" ✅ IMPLEMENTED

*(Analitik Boshqaruv)*

• **Maqsad:** Chuqur tahlil, strategik rejalashtirish va katta hajmdagi ma'lumotlarni ko'rish.
• **Visual Style:** "Control Center" uslubi. Quyuq fon (dark theme), neon urg'ular, vidjetlar tizimi.
• **Technology Stack:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Glassmorphism effects
• **Responsive Design:** Desktop-first, lekin tablet va mobile uchun moslashuvchan
• **Accessibility:** Keyboard navigation, focus states, semantic HTML

--------------------------------------------------------------------------------

## 4. ASOSIY MODULLAR (CORE MODULES)

### 4.1. Moliyaviy Nazorat (Financial Control) ✅

**Implementatsiya:** `financeService.ts`, `/dashboard/finance/page.tsx`

**Funksiyalar:**
• Kirim (Income) va Chiqim (Expense) kiriting
• Kategoriyalar: Food, Transport, Health, Entertainment, Other
• Kunlik tahrirlash mumkin (joriy kun uchun)

**Yangi Imkoniyatlar (v2.4):**
• **Formatted Inputs:** Barcha summalar `1 000 000` formatida kiritiladi.
• **AI Goal Analytics:** Maqsadga yetish vaqti (Oy/Hafta/Kun) va ehtimoli bashorat qilinadi.
• **Detailed Statistics:** Haftalik/Oylik/Oraliq davrlar uchun Bar Chart va tranzaksiyalar ro'yxati.
• **Multi-Currency:** Tranzaksiyalar va Maqsadlar uchun UZS, USD, EUR, RUB qo'llab-quvvatlanadi.

**Qat'iy Mantiq:**
• Yangi kun boshlanganda ma'lumotlar arxivlanadi (`isArchived: true`)
• Arxivlangan kunlar tahrir qilinmaydi (faqat ko'rish)

**Ma'lumotlar Strukturasi:**

```typescript
{
  userId: string;
  date: string; // YYYY-MM-DD
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  transactions: Transaction[];
  isArchived: boolean;
}
```

**AI Tahlil (21:00):** ✅ IMPLEMENTED (Simulated)
Xarajatlar sababini boshqa modullar (stress, mood) bilan bog'lab tahlil qiladi. Hozirda moliya sahifasida "Advanced Stats" va "AI Analysis" kartalari orqali ko'rsatiladi.

**Yangi (v2.5):**
• **Credits Management:** Qarz va kreditlarni boshqarish (Principal/Interest split) ✅
• **Deposits:** Depozitlarni boshqarish (Add funds, Withdraw, Profit tracking) ✅
• **Net Worth:** Haqiqiy sof boylik hisobi (Assets - Liabilities) ✅

---

### 4.2. Ruhiy Holat (Mental Health / Mind) ✅

**Implementatsiya:** `mindService.ts`, `/dashboard/mind/page.tsx`

**Kiritish:**
• Salbiy (-) yoki Ijobiy (+) hissiyotni tanlash
• Energiya darajasi (1-10)
• Ixtiyoriy eslatma (note)

**Mantiq:**
• Yangi kunda tarixga yoziladi va o'zgarmaydi
• Dashboard'da joriy holat ko'rsatiladi

**AI Tahlil (20:00):** 🚧 PENDING
Kunlik hissiy xulosa va tavsiyalar.

---

### 4.3. Fokus (Focus & Productivity) ✅

**Implementatsiya:** `focusService.ts`, `/dashboard/focus/page.tsx`

**Taymerlar:**
• 5, 10, 15, 20, 25 daqiqali Pomodoro sessiyalari
• Start/Pause/Stop funksiyalari
• Session history

**Audio Rejimlar (Ambient Mode):** ✅ NEW in v2.6
• **Brain Waves:** Diqqatni jamlash uchun maxsus to'lqinlar
• **Nature Sounds:** Yomg'ir (Rain), O'rmon (Forest), Okean (Ocean)
• **Lofi Beats:** Ishlash uchun sokin musiqa
• Ovoz balandligini boshqarish va fon musiqasini almashtirish imkoniyati

**Tarix Mantiqi:**
• Muddatidan oldin to'xtatilsa "Failed" deb yoziladi
• Taymer ma'lumotlarini tahrirlash va o'chirish **mumkin emas**
• Distraction tracking

**Overlay (Mini Timer):** 🚧 PENDING (Mobile)
Ilovadan chiqilganda ekran chetida kichik taymer qolishi.

**AI Tahlil (18:00):** 🚧 PENDING
Samaradorlik tahlili va fokus vaqtlari bo'yicha insight.

---

### 4.4. Vazifalar (Tasks) ✅ - Batafsil Mantiq

**Implementatsiya:** `tasksService.ts`, `/dashboard/tasks/page.tsx`

**Maqsad:** Kunlik rejalashtirish, muddatlarni boshqarish va Fokus bilan integratsiya.

**Struktura (3 Ta Bo'lim):**
**Vazifa Ierarxiyasi (v9.0+):** ✅
• **Recursive Subtasks:** Vazifalar cheksiz darajada "bola" vazifalarga ega bo'lishi mumkin.
• **Drag-to-Nest:** Bir vazifani ikkinchisining ustiga sudrab (drag&drop) uni ichki vazifaga aylantirish.
• **Focus View:** Tanlangan vazifa (Focused Task) bo'yicha maxsus ishchi ekran.

**Analytics Mirror (v9.3.5):** ✅
• **Contextual Stats:** Focus View-da statistikalar faqat tanlangan ierarxiya uchun hisoblanadi.
• **Top Cards:** Jami, Tugallangan, Salmoqli (Todo) va Muddati O'tgan vazifalar soni.
• **Kunlik Vaqt Taqsimoti:** 24 soatlik grafikda vazifalar yuklamasini ko'rish.
• **Vazifalar Holati:** Har bir ichki vazifaning individual holatini (health) kuzatish.

**AI Tahlil (09:00):** 🚧 PENDING
Kunlik reja bo'yicha tavsiya va prioritetlash.

---

### 4.5. Global Sana Navigatsiyasi (Date Navigation) ✅

**Implementatsiya:** `DateNavigator.tsx`, `CalendarModal.tsx`

**Mantiq:** Barcha modullarda (Moliya, Vazifalar, Salomatlik) sana navigatsiyasi bir xil.

**Komponentlar:**
• **DateNavigator:** Universal sana tanlash komponenti
• **CalendarModal:** Premium kalendar modal
• **"Yesterday" Button:** Tezkor kechagi kun tugmasi

**Xususiyatlar:**
• Taqvim orqali istalgan sana tanlash
• Bugun/Kecha/Keyingi kun navigatsiya
• Tarix ko'rish (History Modal)
• Responsive design

---

### 4.6. Salomatlik (Health) Moduli ✅

**Implementatsiya:** `healthService.ts`, `/dashboard/health/page.tsx`

**Sensor Ma'lumotlari:** 🚧 PENDING (Mobile sensors)
• Qadamlar (Steps)
• Uyqu (Sleep hours)
• Ekran vaqti (Screen time)
• Avtomatik olinadi, tahrirlash taqiqlangan

**Biometrik Ma'lumotlar:** ✅ (Manual input)
• Bo'y (Height - sm)
• Vazn (Weight - kg)
• Maqsad: Ozish (Lose), Semirish (Gain), Saqlash (Maintain)

**Body Battery:**
• Energiya darajasini 0-100 oralig'ida ko'rsatish
• Uyqu va faoliyat asosida hisoblash

**AI Tahlil (21:00):** ✅ IMPLEMENTED (Simulated)
Kechki payt (21:00 dan keyin) kunlik xulosa (Audio Report) shaklida taqdim etiladi. Steps, Sleep, Water va Stress ma'lumotlarini tahlil qiladi.

---

### 4.7. Ovqat Tahlili (Food AI) ✅ - Batafsil Mantiq

**Implementatsiya:** `foodService.ts`, `/dashboard/food/page.tsx`

**Maqsad:** Kaloriyani aniqlash va ovqatlanish tahlili.

**Kiritish Usullari:**

1. **Kamera:** Real vaqtda rasmga olish ✅
2. **Galereya:** Telefondagi rasmni yuklash ✅
3. **Manual:** Ovqat nomi va kaloriyani qo'lda kiritish ✅

**Jarayon:**

1. Rasm yuklanadi (Firebase Storage)
2. AI tahlil qiladi (GROQ Vision API) 🚧 PENDING
3. Nomi va Kaloriyasi aniqlanadi
4. Foydalanuvchi tasdiqlaydi
5. **Instant Advice** (Tezkor maslahat) beriladi

**Shaxsiy Kontekst:** 🚧 PENDING
AI maslahat berishda foydalanuvchining:
• Salomatlik (biometriya)
• Maqsad (ozish/semirish)
• Qiziqishlar modullaridagi ma'lumotlarni inobatga oladi

*Misol:* Agar maqsad "Ozish" bo'lsa, AI kaloriya defitsiti bo'yicha tavsiya beradi.

**Mantiq:**
• Kun tugagach arxivlanadi
• Tahrirlash taqiqlanadi

**AI Tahlil (22:00):** 🚧 PENDING
Kunlik ovqatlanish xulosasi va ertangi kun tavsiyalari.

---

### 4.8. Qiziqishlar (Interests) ✅ - Refined v2

**Implementatsiya:** `interestsService.ts`, `/dashboard/interests/page.tsx`

**Konseptsiya:** Shaxsiy o'sish va odatlarni boshqarish markazi (Feedback-based AI).

**Asosiy Funksiyalar:**
• **Duality:** Ijobiy (Growth) va Salbiy (Controlled Habit) balans.
• **AI Feedback Loop:** AI har kuni 3 marta tavsiya beradi. Foydalanuvchi "Qiziq/Qiziq emas" tugmalari orqali tavsiyalarga baho berishi AI'ni shaxsiylashtirishni kuchaytiradi.
• **Smart Habit Modes:**

- **Frequency:** Sanoqli odatlar (masalan: sigaret). Har bir urinish alohida sanaladi.
- **Binary:** Bir martalik odatlar (masalan: kech uyg'onish). Kunda faqat bir marta qayd etiladi.
• **AI Habit Coach:** AI kunlik salbiy odatlar tahlili asosida maxsus "Corrective Insight" beradi.
• **Bugungi Mashg'ulotlar (Daily Stats):** Kundalik faoliyatlar jamlangan statistika ko'rinishida aks etadi.
• **Persistence:** Tavsiyalar, feedbacklar va habit counterlar Firestore'da saqlanadi.

**AI Tahlil (Kunlik 3 Tsikl):** ✅ IMPLEMENTED

- Ertalab: Energiya va o'rganishga yo'naltirilgan.
- Abed: Ijtimoiy va kognitiv yangilanish.
- Kechqurun: Oila va dam olish.

--------------------------------------------------------------------------------

## 5. KENGAYTIRILGAN OILA MODULI (FAMILY & LEGACY) ✅

**Implementatsiya:** `familyService.ts` (30+ functions), `/dashboard/family/page.tsx`

### 5.1. Oila Yaratish va Boshqarish

**Tuzilma:**
• Foydalanuvchi maksimal **3 ta** alohida Oila (Family Group) yaratishi mumkin
• Birinchi kirishda: "Oila Yaratish" yoki "Oilaga Qo'shilish" tanlovi

**Yaratish (Create):** ✅
• Foydalanuvchi Oila nomini kiritadi
• **Creator Profile Setup (PRD v2.1 UPDATE):**

- Yaratuvchi o'zi haqida to'liq ma'lumot kiritadi
- To'liq ism (Familiya bilan)
- Tug'ilgan sana
- Rol (Ota, Ona, etc.)
• Yaratuvchi (Owner) avtomatik admin huquqiga ega

**Tahrirlash va O'chirish:** ✅
• Oila nomini o'zgartirish faqat Owner uchun
• **Soft Delete:** O'chirilganda arxivga o'tadi
• **Restore:** 1 oy ichida qayta tiklash mumkin
• 1 oydan so'ng ma'lumotlar butunlay o'chadi

---

### 5.2. A'zolik va Rollar (Membership & Roles) ✅

**Qo'shilish (Join):**
• Foydalanuvchi Oila ID orqali so'rov yuboradi
• So'rov Owner'ga boradi
• Owner "Approve" yoki "Deny" qilishi mumkin

**Tasdiqlash Oqimi (Approval Workflow):** ✅

1. Owner "So'rovlar" (Requests) oynasini ko'radi
2. Har bir so'rovda nomzodning ismi
3. Owner "Qabul qilish" bosganda **Rol tanlash MAJBURIY**
4. Rol tanlangach, a'zo qo'shiladi
5. Boshlang'ich profil yaratiladi (Coins: 0, Level: 1)

**Rollar (18 ta rol):**

- Bobo (Grandfather), Buvi (Grandmother)
- Ota (Father), Ona (Mother)  
- Aka (Brother), Uka (Younger Brother)
- Opa (Sister), Singil (Younger Sister)
- O'g'il (Son), Qiz (Daughter)
- Amaki, Tog'a (Uncles)
- Amma, Xola (Aunts)
- Jiyan (Nephew/Niece)

**Boshqaruv:** ✅
• Owner a'zoni oiladan chiqarishi mumkin (Kick)
• A'zo o'zi tark etishi mumkin (Leave)

---

### 5.3. Interfeys Va UX (Family Experience) ✅

**"Seamless" Kirish:**
• Agar foydalanuvchi kamida 1 ta oilaga a'zo bo'lsa, to'g'ridan-to'g'ri **Active Group Dashboard** ochiladi
• "Oila Tanlash" header'da Dropdown/Switcher sifatida
• Oila yaratish va qo'shilish Switcher ichida

**Real-time Synchronization:** ✅ NEW in v2.1
• Firestore listeners orqali real vaqtda yangilanish
• A'zo qo'shilganda barcha a'zolar darhol ko'radi
• So'rovlar real-time badge bilan ko'rsatiladi

**Auto-Healing Mechanism:** ✅ NEW in v2.1
• Agar a'zo ismi "New Member" bo'lsa, tizim avtomatik user profile'dan to'g'ri ismni oladi
• Background'da avtomatik tuzatish

---

### 5.4. Smart Parenting (Gamification) ✅

**Mantiq:**
• Ota-ona (yoki Owner) farzandiga vazifa qo'yadi
• Mukofot: "Ekran vaqti" yoki "Coins" beriladi
• Bola o'z profilida balansni ko'radi

**Task Assignment:**
• Task description
• Reward type (screen time / coins)
• Reward amount
• Status tracking

---

### 5.5. Family Data & Genealogy Logic (Shajara) ✅

**Core Principle:** Shajara "Dinamik Avlod Dvigateli" asosida ishlaydi.

**Data Integrity:**
• **Majburiy Maydonlar:**

- `fullName`: To'liq Ism
- `birthDate`: Tug'ilgan sana
- `role`: Oiladagi rol
- `fatherId` / `motherId`: Ota-ona ID'lari (agar mavjud bo'lsa)
- `spouseId`: Turmush o'rtog'i (ixtiyoriy)

**Oila Yaratish Flow:** ✅
• Creator o'zi haqida to'liq ma'lumot kiritadi
• Avtomatik ravishda `Head` (Bosh) avlod sifatida belgilanadi

**A'zolarni Qo'shish va Bog'lash:** ✅
• Owner yangi a'zoni qabul qilayotganda:

  1. Rol tanlaydi
  2. Ota-onasini belgilaydi (Parent Linkage)
  3. *Avtomatik Mantiq:* Agar Owner (Erkak) "O'g'il" qabul qilsa, `fatherId` avtomatik Owner'ga tenglashadi

**Member Profile Editing:** ✅ NEW in v2.1
• Owner yoki a'zo o'zi profilni tahrirlash mumkin
• Barcha maydonlarni o'zgartirish: ism, tug'ilgan sana, rol, ota-ona, turmush o'rtog'i
• Profession, education, bio qo'shish

**Vizual Daraxt (Tree Visualization):** ✅
• Daraxt "Avlodlar" (Generations) bo'yicha qatlamlarga bo'linadi
• Tug'ilgan yil va parent links asosida joylashuv
• Interactive tree with zoom/pan
• Click to view member profile
• **Real-time Engine:** Daraxt ma'lumotlari Firestore'dan real vaqtda yangilanadi.

**Member Profile (v2.1 Update):** ✅
• To'liq tahrirlash imkoniyati: Ism, Sana, Rol, Ota, Ona, Spouse.
• Qo'shimcha ma'lumotlar: Kasbi, Ma'lumoti, Biografiya.
• Avtomatik sinxronizatsiya (User metadata into Family Member).

---

### 5.6. Keksalar uchun "Passiv G'amxurlik" 🚧 PENDING

**Safety Monitor:**
• Keksa a'zolar (Bobo, Buvi) uchun:

- So'nggi faollik monitoring
- Batareya quvvati tracking
- Emergency alerts

--------------------------------------------------------------------------------

## 6. OVOZLI BOSHQARUV (VOICE COMMAND) ✅ PARTIAL

**Implementatsiya:** `VoiceInput.tsx`, `useVoiceCommand.ts` hook

**Integratsiya:**
• Speech-to-text orqali ovozli buyruq
• AI tahlil qilib tegishli modulga joylanishi 🚧 PENDING
• Modul avtomatik ochilishi 🚧 PENDING

**Current Features:**
• Recording start/stop ✅
• Visual feedback (pulse animation) ✅
• Recording state management ✅

**Pending Features:**
• GROQ AI intent parsing
• Module routing based on voice
• Data extraction from voice
• Multi-language voice support

**Mantiq:**
• Ovozli kiritilgan ma'lumotlar joriy kunda tahrirlanishi mumkin

--------------------------------------------------------------------------------

## 7. WEB PLATFORMA TUZILMASI ✅

### 7.1. Landing Page (Sotuv Voronkasi) 🚧 PENDING

**Maqsad:** Ilovaning nima uchun kerakligini tushuntirish va sotish.

**Struktura:**
• Muammo (Stress/Vaqt) → Yechim (AURA) → Ijtimoiy Isbot → Dashboardga o'tish (CTA)

**Pages:**
• Hero section
• Features showcase
• Pricing tiers
• Testimonials
• Footer with links

---

### 7.2. Web Dashboard ✅ IMPLEMENTED

**Imkoniyatlar:**
• Barcha 7 ta asosiy modul
• Kengaytirilgan Shajara
• Real-time data sync
• Responsive design
• Multi-language UI

**Dizayn:**
• Katta ekranlar uchun ma'lumotlar mantiqiga rioya qilgan holda vidjetli joylashuv
• Dark theme with glassmorphism
• Neon accents (cyan, purple, gold, etc.)
• Smooth animations

**Navigation:**
• Sidebar with module links
• Badge notifications ✅
• User profile menu
• Settings access

--------------------------------------------------------------------------------

## 8. TEXNIK VA HUQUQIY (TECHNICAL & AUTH) ✅

### 8.1. Authentication

**Ro'yxatdan o'tish:** ✅
• Google OAuth
• Email/Password
• Protected routes (`ProtectedRoute.tsx`)

**User Profile Management:**
• Display name
• Email
• Language preference
• Profile photo (planned)

---

### 8.2. Tariflar 🚧 PENDING

**Plans:**
• **Trial:** 1 hafta bepul
• **Free:** Basic features
• **Individual:** Advanced features
• **Family:** Shajara va Keksalar nazorati

---

### 8.3. Data Architecture

**Google Antigravity:**
• Tizim "Data-Driven AI" mantiqida quriladi
• Barcha o'zgarishlar (Events) AI konteksti uchun real vaqtda yuboriladi 🚧 PENDING

**Firebase Firestore Collections:**

```
users/
  {userId}/
    profile
    family_members/
    ancestors/
    parenting_requests/
    
daily_logs/
  {userId}_{date}/
    finance, health, mind, food
    
tasks/
family_groups/
notifications/
```

--------------------------------------------------------------------------------

## 9. BILDIRISHNOMALAR TIZIMI (NOTIFICATION SYSTEM) ✅

**Implementatsiya:** `NotificationContext.tsx`

**Maqsad:** Foydalanuvchini har bir moduldagi yangi voqealar haqida xabardor qilish.

**Visual Mantiq:**
• Sidebar'da har bir modul nomi yonida qizil **Badge** (raqam)
• Real-time: Ma'lumotlar bazasida o'zgarish bo'lishi bilan badge paydo bo'ladi

**Badge Types:**
• `family`: Yangi join so'rovlari, vazifa tasdiqlashlari
• `tasks`: Overdue tasks soni
• `health`: Low body battery alerts (planned)

**Avto-kamayish:**
• Foydalanuvchi tegishli modulga kirishi bilan badge avtomatik tozalanadi
• Sahifa yangilash talab etilmaydi (real-time)

**Functions:**
• `incrementNotification(module)`
• `clearNotification(module)`
• `getNotificationCount(module)`

--------------------------------------------------------------------------------

## 10. REAL-TIME SYNCHRONIZATION SYSTEM ✅ NEW

**Texnik Implementatsiya:**

### 10.1. Firestore Real-time Listeners

**Family Module Listeners:**

```typescript
subscribeToFamilyGroup(groupId, callback)
subscribeToUserFamilies(userId, callback)
subscribeToFamilyMembers(ownerId, callback)
subscribeToDeletedFamilies(userId, callback)
```

**Benefits:**
• Instant updates across all users
• No manual refresh needed
• Multi-device synchronization
• Offline support (Firebase SDK)

### 10.2. Notification Context

**Architecture:**
• Global state management
• Subscribe/unsubscribe pattern
• Automatic badge updates
• Module-specific counters

### 10.3. Data Consistency

• Optimistic UI updates
• Rollback on errors
• Conflict resolution
• Timestamp-based ordering

--------------------------------------------------------------------------------

## 11. COMMAND PALETTE ✅ NEW

**Implementatsiya:** `CommandPalette.tsx`

**Purpose:** Tezkor navigatsiya va qidiruv.

**Features:**
• **Keyboard Shortcut:** `⌘K` (Mac) yoki `Ctrl+K` (Windows)
• Quick module access
• Search functionality
• Recent actions history (planned)

**Commands:**
• Go to Finance
• Go to Health
• Go to Family
• Create new task
• Log food
• Start focus session

**UI:**
• Modal overlay
• Search input
• Command list with icons
• Keyboard navigation support

--------------------------------------------------------------------------------

## 12. VISUALIZATION WIDGETS ✅ NEW

### 12.1. Butterfly Effect Widget

**Implementatsiya:** `ButterflyEffectWidget.tsx`

**Purpose:** Modullar o'rtasidagi korrelyatsiyani ko'rsatish.

**Data Sources:**
• Finance (spending)
• Mind (stress level)
• Health (body battery)
• Focus (productivity)

**Visualization:**
• Interactive graph/chart
• Color-coded correlations
• Hoverable data points
• Time range selector

**Insights:**
• "High spending correlates with high stress"
• "Low sleep affects focus performance"
• "Exercise improves mood"

---

### 12.2. Smart Onboarding

**Implementatsiya:** `SmartOnboarding.tsx`

**Purpose:** Yangi foydalanuvchilarni yo'naltirish.

**Detection:**
• Check if user has no data
• First-time visitor flag

**Content:**
• Welcome message
• Quick start guide
• Module tour
• Sample data option

---

### 12.3. Dashboard Widgets (Main Page)

**Implemented Components:**
• **Chronos:** Real-time clock
• **Atmosphere:** Weather widget (mock data)
• **Wealth Pulse:** Finance overview
• **Family Hub:** Family alerts
• **Vitality:** Health snapshot
• **Nutrition:** Daily calories
• **Hobbies:** Interest streak
• **Liveness Status:** Safety check-in for elderly/family (Panic Button & I'm OK) ✅ NEW

**Layout:**
• CSS Grid responsive layout
• Glassmorphism card design
• Hover effects
• Link to detailed module pages

--------------------------------------------------------------------------------

## 13. ADVANCED CALENDAR & DATE NAVIGATION ✅ NEW

### 13.1. CalendarModal Component

**Features:**
• Month/Year selection
• Day picker
• Highlight today
• Highlight selected date
• Disable future dates (optional)
• Premium design with- **Version**: 2.3 - "The Financial Revolution"

- **Last Updated**: 2026-01-20
- **Status**: Production Ready / Module V10
• Finance module (planned)
• Health module (planned)
• Food module (planned)

---

### 13.2. DateNavigator Component

**Universal Date Control:**
• Today button
• Yesterday button
• Next/Previous day arrows
• Calendar modal trigger
• Display current selected date

**Integration:**
• Shared across all modules
• Consistent UX
• Same styling

---

### 13.3. History Modal

**Implementatsiya:** `HistoryModal.tsx`

**Purpose:** Timeline view of past data.

**Features:**
• Date-based filtering
• Summary cards
• AI insights (when available)
• Scrollable history

**Modules:**
• Finance history
• Focus sessions history
• Food log history
• Task completion history

--------------------------------------------------------------------------------

## 14. DEPLOYMENT & ENVIRONMENTS ✅

### 14.1. Technology Stack

**Frontend (Web):**
• Next.js 14 (App Router)
• TypeScript
• Tailwind CSS
• React 18

**Backend:**
• Firebase Authentication
• Cloud Firestore
• Firebase Storage
• Cloud Functions 🚧 PENDING

**Hosting:**
• Vercel (recommended for Next.js)
• Firebase Hosting (alternative)

### 14.2. Environment Configuration

**Environment Variables:**

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Firestore Security Rules:**
• User can only read/write own data
• Family members can read shared family data
• Owner has admin rights in family groups

### 14.3. Build & Deploy

**Development:**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
npm start
```

**Continuous Deployment:**
• Git push to main branch
• Auto-deploy via Vercel/Firebase
• Preview deployments for PRs

--------------------------------------------------------------------------------

## 15. 🚧 BACKEND IMPLEMENTATION STATUS

### ✅ Implemented (Web Frontend)

• Firestore database structure
• Security rules (basic)
• Real-time listeners
• User authentication
• File upload (Firebase Storage)

### 🔴 Pending Implementation

**Cloud Functions:**

1. **`dailyCrunch`**
    - Trigger: Cron Job (23:59 daily)
    - Purpose: Archive previous day's data
    - Set `isArchived: true` for all users

2. **`analyzeFinance`**
    - Trigger: Cron Job (21:00 daily)
    - Purpose: AI analysis of spending patterns
    - Cross-reference with mood/stress data

3. **`analyzeMood`**
    - Trigger: Cron Job (20:00 daily)
    - Purpose: Mental health trend analysis
    - Recommendations based on patterns

4. **`analyzeFocus`**
    - Trigger: Cron Job (18:00 daily)
    - Purpose: Productivity metrics
    - Identify distraction patterns

5. **`analyzeTasks`**
    - Trigger: Cron Job (09:00 daily)
    - Purpose: Daily plan recommendations
    - Priority re-ordering

6. **`analyzeHealth`**
    - Trigger: Cron Job (08:00 daily)
    - Purpose: Health insights
    - Biometric trend analysis

7. **`analyzeInterests`**
    - Trigger: Cron Job (19:00 daily)
    - Purpose: Hobby suggestions
    - Learning resource recommendations

8. **`analyzeFood`**
    - Trigger: Cron Job (22:00 daily)
    - Purpose: Nutrition summary
    - Meal planning suggestions

9. **`smartParentingUnlock`**
    - Trigger: Firestore trigger on task completion
    - Purpose: Reward distribution
    - Parent notification

10. **`processVoiceCommand`**
    - Trigger: HTTP callable
    - Purpose: Parse voice intent
    - Route to appropriate module

**AI Integration:**
• GROQ API setup
• Prompt engineering
• Response formatting
• Context management

**Push Notifications:**
• Firebase Cloud Messaging
• Notification scheduling
• User preference management

--------------------------------------------------------------------------------

## 16. 📱 MOBILE APP IMPLEMENTATION STATUS

### ✅ Existing Structure

• React Native (Expo) project initialized
• Firebase config present
• Basic folder structure

### 🔴 Pending Development

**"The Soul" UI Concept:**
• Aura Sphere interactive component
• Emotion-based color changes
• Minimalist navigation
• Thumb-friendly controls

**Core Features:**
• All 7 modules (mobile-optimized)
• Camera integration (Food AI)
• Focus Overlay (mini timer on other apps)
• Sensor data collection:

- Pedometer (steps)
- Sleep tracking (HealthKit/Google Fit)
- Screen time API

**Adaptive UI:**
• Stress-based UI simplification
• Calming mode visuals
• Reduced options when overwhelmed

**Mobile-specific:**
• Push notifications
• Background task handling
• Offline mode
• Biometric login (Face ID, Fingerprint)

**Navigation:**
• Tab navigation
• Stack navigation
• Deep linking
• Universal links

--------------------------------------------------------------------------------

## 17. ROADMAP & PRIORITIES

### Phase 1: Web Platform Completion ✅ 90% DONE

- [x] Authentication system
- [x] All 7 core modules UI
- [x] Real-time sync
- [x] Multi-language support
- [x] Family module (advanced)
- [x] Date navigation system
- [ ] Landing page (sotuv voronkasi)
- [ ] Pricing page
- [ ] User settings page enhancements

### Phase 2: Backend & AI 🚧 IN PROGRESS 10%

- [ ] Cloud Functions deployment
- [ ] GROQ AI integration
- [ ] All scheduled AI analyses
- [ ] Push notifications
- [ ] Voice command AI parsing
- [ ] Food image recognition
- [ ] Butterfly Effect calculations

### Phase 3: Mobile App 🚧 NOT STARTED

- [ ] UI/UX implementation ("The Soul")
- [ ] Sensor integrations
- [ ] Camera features
- [ ] Focus overlay
- [ ] Offline mode
- [ ] App store deployment

### Phase 4: Advanced Features 🎯 FUTURE

- [ ] Social features (friend connections)
- [ ] Marketplace (for therapists, coaches)
- [ ] Advanced analytics dashboard
- [ ] Export reports (PDF)
- [ ] Apple Watch / Wear OS apps
- [ ] API for third-party integrations

--------------------------------------------------------------------------------

## APPENDIX A: FIRESTORE DATA SCHEMA

### Users Collection

```typescript
users/{userId}
{
  uid: string;
  email: string;
  displayName: string;
  fullName: string;
  language: 'en' | 'uz' | 'ru';
  photoURL?: string;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
}
```

### Daily Logs

```typescript
daily_logs/{userId}_{date}
{
  userId: string;
  date: string; // YYYY-MM-DD
  
  finance: {
    totalIncome: number;
    totalExpense: number;
    transactions: Transaction[];
  };
  
  mind: {
    mood: 'positive' | 'negative' | 'neutral';
    energyLevel: number; // 1-10
    note?: string;
  };
  
  health: {
    steps: number;
    sleepHours: number;
    screenTime: number;
    bodyBattery: number;
    weight?: number;
    height?: number;
  };
  
  food: {
    meals: FoodEntry[];
    totalCalories: number;
  };
  
  isArchived: boolean;
  createdAt: Timestamp;
}
```

### Family Groups

```typescript
family_groups/{groupId}
{
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // userId array
  createdAt: Timestamp;
  deletedAt?: Timestamp;
}
```

### Family Members (Subcollection)

```typescript
users/{ownerId}/family_members/{memberId}
{
  id: string;
  name: string;
  fullName: string;
  birthDate: string;
  role: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  profession?: string;
  education?: string;
  bio?: string;
  coins: number;
  level: number;
  status: 'home' | 'work' | 'school' | 'gym' | 'legacy';
  mood: 'happy' | 'focused' | 'tired' | 'stressed';
}
```

### Tasks

```typescript
tasks/{taskId}
{
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'done';
  date: string; // YYYY-MM-DD
  timeStart?: string;
  timeEnd?: string;
  focusSessionId?: string;
  createdAt: Timestamp;
}
```

--------------------------------------------------------------------------------

## APPENDIX B: COMPONENT HIERARCHY

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx (Landing)
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/
│   │       ├──| 💰 Finance Module   | 100% (V10)  | Dual-Budgeting, AI Career Pathing, Rates |
├── layout.tsx (Sidebar + Auth)
│   │       ├── finance/
│   │       ├── health/
│   │       ├── mind/
│   │       ├── focus/
│   │       ├── tasks/
│   │       ├── food/
│   │       ├── interests/
│   │       ├── family/
│   │       │   ├── page.tsx
│   │       │   ├── genealogy/
│   │       │   └── ClientProfile.tsx
│   │       └── settings/
│   │
│   ├── components/
│   │   ├── Modal.tsx
│   │   ├── CalendarModal.tsx
│   │   ├── HistoryModal.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── VoiceInput.tsx
│   │   ├── FamilyTree.tsx
│   │   ├── FamilyInvite.tsx
│   │   ├── MiniTree.tsx
│   │   ├── ParentSelector.tsx
│   │   ├── ButterflyEffectWidget.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── AmbientSound.tsx
│   │   └── dashboard/
│   │       ├── DateNavigator.tsx
│   │       └── SmartOnboarding.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── services/
│   │   ├── financeService.ts
│   │   ├── healthService.ts
│   │   ├── mindService.ts
│   │   ├── focusService.ts
│   │   ├── tasksService.ts
│   │   ├── foodService.ts
│   │   ├── interestsService.ts
│   │   ├── familyService.ts
│   │   ├── dailyService.ts
│   │   └── userService.ts
│   │
│   └── hooks/
│       └── useVoiceCommand.ts
```

--------------------------------------------------------------------------------

## XULOSA

Ushbu PRD v2.1 hujjati AURA loyihasining hozirgi holatini to'liq aks ettiradi:

**✅ Amalga oshirilgan (Web Platform):**

- 7 ta asosiy modul
- Real-time synchronization
- Multi-language support
- Advanced family management
- Calendar & date navigation
- Voice command UI
- Notification system
- Authentication

**🚧 Ishlab chiqilmoqda:**

- Landing page
- User settings enhancements
- Missing module features

**🔴 Rejalashtirilgan:**

- Backend Cloud Functions
- AI integrations (GROQ)
- Mobile app (React Native)
- Advanced analytics
- Push notifications

**Keyingi Qadamlar:**

1. Backend Cloud Functions'ni yozish
2. AI API'larni integratsiya qilish
3. Mobile app'ni boshlash
4. Landing page tugallash
5. Production deployment

Bu hujjat loyiha uchun "Master Plan" sifatida xizmat qiladi va barcha stakeholder'lar uchun aniq yo'l-yo'riq beradi.

**Versiya Tarixi:**

- v1.0: Initial release (konsept)
- v2.0: Kengaytirilgan xususiyatlar (PRD v2.0'dan)
- v2.1: Joriy implementatsiyaga moslashtirilgan (2026-01-15)

---
*Hujjat muallifi: Siyovush Abdullayev*  
*Oxirgi yangilanish: 2026-01-15*
