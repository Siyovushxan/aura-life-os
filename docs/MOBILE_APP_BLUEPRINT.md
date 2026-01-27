# AURA Mobile App Blueprint: The "Neural Command Center" Edition

## 1. Vision & Identity

AURA mobil ilovasi shunchaki "dashboard" emas, balki foydalanuvchining **Neural Command Center** (Asab Markazi)ga aylanishi kerak. Dizayn web-versiyadagi kabi premium bo'lishi, lekin mobil interfeysning cheklovlari va imkoniyatlaridan kelib chiqib, ma'lumotlarni **o'ta aniq va mazmundor** (high-density, high-meaning) holda taqdim etishi shart.

---

## 2. Masterpiece Layout Architecture

### A. The "Neural Heart" (Hero Section)

- **Butterfly Effect Gauge**: Ekranning markaziy va eng katta elementi. Bu shunchaki doira emas, balki hayotingizning "sog'liq", "moliya" va "vazifalar" kabi sohalari bir-birini qanday impuls bilan urayotganini ko'rsatuvchi tirik ekotizim.
- **Glow Logic**: Agar score past bo'lsa (masalan 20), butun hero section qizil-to'q sariq "stress" rangiga kiradi. Agar score baland bo'lsa (80+), u cyan-purple "harmony" nurini sochadi.
- **Real-time Status**: Score ostida bitta jumlada eng muhim xulosa (Correlations) yoziladi.

### B. "Vital Pulse" (Horizontal Activity Bar)

- Web-dagi "Bento Grid" mobil uchun **gorizontal suriluvchi stats-bar** yoki **ziqroq (compact) vertikal guruhlarga** bo'linadi.
- Ma'lumotlar o'ta aniq: "Moliya" emas, "Hamyon: 36M UZS (-2.4%)". "Salomatlik" emas, "Steps: 8.4k / 10k".

### C. "Neural Insight" (Smart Overlay)

- AI tahlillari endi statik tekst emas, balki ekran tubidan suzib chiquvchi, chekkalari "blur" qilingan ethereal oyna.
- **Micro-Action**: Har bir tahlil ostida bitta "Quick Fix" tugmasi (masalan, "Uyquni yaxshilash uchun Pomodoro-ni yoqish").

### D. "Butterfly FAB" (Infinite Action Button)

- Ekranning markaziy pastki qismida joylashgan.
- **Ovozli buyruq**: Markaziy AI.
- **Quick Log Menu**: Unga uzoq bosganda (Long press) tezkor menyu chiqadi: "Rasmga olish (Food)", "Xarajat qo'shish", "Diqqatni boshlash".

---

## 3. Real Data Integration Strategy

| Ma'lumot turi | Firestore Location | Mobile Implementation |
| :--- | :--- | :--- |
| **Harmony Score** | Derived from Health, Finance, Tasks | `correlationService` orqali real vaqtda hisoblanadi. |
| **Total Wealth** | `users/{uid}/finance/overview` | `totalBalance` fieldini real vaqtda (`onSnapshot`) o'qish. |
| **Daily Health** | `users/{uid}/health_logs/{today}` | `steps`, `calories`, `sleep` ma'lumotlarini dinamik chiqarish. |
| **Tasks Pending** | `users/{uid}/tasks` | Ochiq qolgan vazifalar sonini real vaqtda sanash. |

---

## 4. UI/UX "Designer Touch" (Premium Details)

- **Haptic Feedback**: Har bir karta bosilganda va AI buyruq bajarganda turli darajadagi tebranish.
- **Dynamic Shadows**: Elementlar ostidagi soyalar ularning rangi bilan bir xil (Neon Shadow) bo'lishi.
- **Typography**: Sarlavhalar uchun `Inter-Black`, raqamlar uchun `Outfit-Bold` va tushuntirishlar uchun `Inter-Medium` shriftlari.

---
*Ushbu hujjat AURA-ning mobil masterpiecesiga aylanishi uchun asos bo'lib xizmat qiladi.*
