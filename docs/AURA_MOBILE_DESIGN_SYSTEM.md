# AURA - MOBIL DIZAYN TIZIMI VA UI STANDARTLARI (v4.0: The Twin Reality)

**Status:** Production Ready  
**Platforma:** iOS & Android (React Native / Expo)  
**Moslik:** Web Dashboard v2.6 bilan 100% Funksional Paritet  
**Falsafa:** "Cho'ntakdagi Strategik Boshqaruv Markazi"

Ushbu hujjat AURA mobil ilovasining yakuniy dizayn konstitutsiyasidir. Bizning qoidamiz qat'iy: "Mobil versiya — bu Web'ning kichik ukasi emas, balki uning egizagidir." Foydalanuvchi kompyuterda qila oladigan har qanday ishni telefonda ham, aynan o'sha chuqurlikda qila olishi shart.

---

## 1. GLOBAL DIZAYN KODLARI (MOBILE DNA)

Vizual til "Deep Immersion" (Chuqur Sho'ng'ish) tamoyiliga asoslanadi. Maqsad: Foydalanuvchi ma'lumot kiritayotganda telefonni his qilmasligi kerak, faqat AURA bilan muloqotda bo'lishi lozim.

### 1.1. Vizual Asoslar

- **Fon (Background):** OLED Pure Black (#000000). Batareyani tejaydi va neon ranglarni "porlata"di.
- **Material:** Mobile Glassmorphism. Webdagi xira shisha effekti mobil GPU uchun optimallashtirilgan (Overlay: 85% qora + 15px Blur).
- **Shriftlar:**
  - **Sarlavhalar:** Space Grotesk (Katta, qalin).
  - **Matn:** Inter (O'qish uchun maksimal qulaylik).
- **Ergonomika:** Barcha interaktiv elementlar (tugmalar, kartochkalar) ekran pastki qismida joylashadi (Thumb Zone - Bosh barmoq yetadigan joy).

---

## 2. ASOSIY EKRAN VA NAVIGATSIYA (HOME SCREEN)

Asosiy ekran — bu sizning kunlik holatingizning Executive Summary (Boshqaruv Xulosasi). U yerda Web Dashboarddagi eng muhim raqamlar va grafiklar ixchamlashtirilgan holda turadi.

### 2.1. Header (Yuqori Qism)

Ekranning eng yuqorisida, status bar ostida joylashgan shaffof panel.

- **Chapda:** AURA logotipi (Sfera).
- **O'ngda:**
  - **Bildirishnoma (Bell):** O'qilmagan xabarlar qizil nuqta bilan ko'rsatiladi.
  - **Profil (Avatar):** Boshqaruvchi rasmi.
- **Funksiyasi:** Bosilganda oddiy sozlamalar emas, "Admin Panel" ochiladi.- **Strategik Boshqaruv Dashboarddan** farqli ravishda, mobil versiya "Hissiyotlar Markazi" deb ataladi., Oila a'zolarini boshqarish, Eksport, Tizim loglari) mavjud.

### 2.2. Bottom Bar (Pastki Panel) — The Command Dock

Sizning talabingiz bo'yicha aniq 5 ta bo'limdan iborat "Floating Dock" (Suzuvchi Dok):

1. **Finance (Moliya):** Hamyon balansi va tezkor tranzaksiya.
2. **AURA (Ovozli Boshqaruv - Markazda):** Eng katta tugma.
    - *Tap:* Tezkor menyu.
    - *Hold (Bosib turish):* Ovozli buyruq ("Aura, tushlikka 50 ming ketdi").
3. **Tasks (Vazifalar):** Kunlik reja va kalendar.
4. **Food (Ovqatlanish):** Kaloriya hisoblash va Food AI kamerasi.

---

## 3. INTERAKTIV NAVIGATSIYA: "THE SLIDE DECK"

AURA mobil ilovasining eng o'ziga xos xususiyati — bu modullar o'rtasida o'tish usuli.

### 3.1. "Swipe Right" (Chapdan O'ngga Surish)

Foydalanuvchi asosiy ekranni chapdan o'ngga surganda (yoki pastki paneldagi "Menu" tugmasini bosganda), ekran xiralashadi va 8 ta Modul Kartochkasi (Module Cards) paydo bo'ladi.

- **Ko'rinishi:** Kartochkalar vertikal yoki 2 qatorli to'r (Grid) holatida suzib chiqadi.
- **Tarkibi (8 Modul):**
    1. Moliya (Finance)
    2. Salomatlik (Health)
    3. Aql (Mind)
    4. Fokus (Focus)
    5. Vazifalar (Tasks)
    6. Ovqat (Food)
    7. Qiziqishlar (Interests)
    8. Oila (Family)

### 3.2. Kartochka Logikasi (Mini-Dashboard)

Har bir kartochka shunchaki ikonka emas, u "Jonli Vidjet"dir.

- **Kartochka holati:** Masalan, "Moliya" kartochkasida hozirgi balans va bugungi xarajat limiti ko'rinib turadi.
- **Interaction:** Kartochka ustiga bossangiz, u kengayib (Expand animation), to'liq Web Dashboard funksionalligiga ega bo'lgan sahifaga aylanadi.

---

## 4. MODULLARNING MUKAMMAL MOBIL TALQINI

Webdagi har bir murakkab modul mobil ekranda qanday ishlashi kerak? Biz "Qulaylik va Tezlik"ka urg'u beramiz.

### 4.1. Moliya (Finance)

- **Kiritish (Input):** Telefonda raqam terish zerikarli.
- **Yechim:** "Smart Wheel" (Baraban). Summani kiritish uchun raqamlarni aylantirasiz. Barmoq bilan surish orqali summa o'zgaradi va telefon "tq-tq-tq" (Haptics) titraydi.
- **Grafiklar:** Webdagi katta grafikni ko'rish uchun telefonni Landshaft (Yonbosh) holatiga o'girasiz. Shunda grafik butun ekranga yoyilib, chuqur tahlil rejimi ochiladi.

### 4.2. Vazifalar (Tasks)

- **Gestures (Imo-ishoralar):**
  - **O'ngga surish:** Bajarildi (Yashil rang + Konfetti).
  - **Chapga surish:** Tahrirlash yoki Ertaga qoldirish.
  - **Drag & Drop:** Vazifani bosib turib, ustunlik darajasini o'zgartirish.

### 4.3. Ovqat va Salomatlik (Food AI)

- **AR Camera:** "Ovqat" bo'limiga kirganda darhol kamera ochiladi. Ovqatni rasmga olish shart emas, kamerani tutish kifoya — AI real vaqtda ekranda "Osh: 700 kkal" yozuvini chiqaradi.

### 4.4. Ovozli Boshqaruv (Voice Command)

- Bottom Bar markazidagi AURA tugmasi har doim qo'l ostida.
- Foydalanuvchi yo'l-yo'lakay ketayotganda tugmani bosib turadi va gapiradi: "Eslatma qo'sh: Ertaga soat 10 da majlis bor". Tizim buni avtomatik Vazifalar moduliga va Kalendarga joylaydi.

---

## 5. QO'SHIMCHA IMKONIYATLAR

### 5.1. Profil va "Strategik Boshqaruv"

Yuqori o'ng burchakdagi Profil rasmi bosilganda ochiladigan menyu:

- **Tizim Sozlamalari:** Web versiyadagi barcha sozlamalar.
- **API Keys:** GROQ va boshqa integratsiya kalitlarini o'zgartirish.
- **Ma'lumotlar Bazasi:** Eksport (PDF/Excel) va Import qilish.
- **Oila Boshqaruvi:** Yangi a'zo qo'shish yoki rollarni o'zgartirish.

### 5.2. Bildirishnomalar (Smart Notifications)

Shunchaki "Vazifani bajar" emas, balki kontekstli eslatmalar:

- *Ssenariy:* "Ahmad, bugun stress darajangiz yuqori (Health moduli ma'lumoti). Fokus vaqtini 15 daqiqaga qisqartirib, nafas olish mashqini bajarishni tavsiya qilaman."

### 5.3. Xavfsizlik

- Ilovaga kirishda FaceID/TouchID (ixtiyoriy).
- Moliya va Kundalik (Journal) bo'limlariga kirishda majburiy FaceID so'rovi.

---

## 6. XULOSA: YAGONA EKOTIZIM

AURA Mobil ilovasi (v4.0) foydalanuvchining talablariga to'liq javob beradigan, Web Dashboard bilan 100% sinxron ishlaydigan mukammal vositadir.

- **Tezkorlik:** Bottom Bar va Ovozli boshqaruv.
- **Chuqurlik:** "Swipe to Reveal" orqali barcha 8 modulga kirish.
- **Qulaylik:** Landshaft rejim va Haptic feedback.

Bu shunchaki ilova emas, bu — hayotni boshqarish pulti.
