# AURA - Texnik Arxitektura va Tizim Dizayni (v2.0)

**Versiya:** 2.5  
**Oxirgi Yangilanish:** 2026-01-25  
**PRD Mos Kelish:** v2.5

Ushbu hujjat AURA loyihasining texnik "suyagi" hisoblanadi. Biz **Firebase** ekotizimidan foydalangan holda Xavfsiz, Tezkor va Scalable (kengayuvchan) tizim quramiz.

> **Status Indicator:**  
> ✅ Implemented | 🚧 In Progress | 🔴 Pending

## 1. Texnologiyalar Steki (Tech Stack)

| Yo'nalish | Texnologiya | Sabab va Izoh | Status |
| :--- | :--- | :--- | :---: |
| **Mobil Ilova** | **React Native (Expo)** | Tezkor ishlab chiqish, iOS va Android uchun bitta kod. Firebase JS SDK bilan mukammal ishlaydi. | 🔴 |
| **Web Dashboard** | **Next.js 14 (App Router)** | SSR va SEO uchun eng yaxshisi. Katta ekranlar uchun moslashuvchan. | ✅ |
| **Frontend Language** | **TypeScript** | Type safety, better IDE support, fewer runtime errors. | ✅ |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework, rapid development. | ✅ |
| **State Management** | **React Context API** | AuthContext, LanguageContext, NotificationContext. | ✅ |
| **Backend & Auth** | **Firebase** | Google tomonidan qo'llab-quvvatlanadi. Auth, Database va Hosting bitta joyda. | ✅ |
| **Database** | **Cloud Firestore** | NoSQL. Real vaqtda (Real-time) yangilanish uchun ideal. | ✅ |
| **File Storage** | **Firebase Storage** | Food images, user avatars. | ✅ |
| **Server Logic** | **Cloud Functions v2** | AURA AI Core: Groq-powered backend endpoints (HTTP v2 Gen). | ✅ |
| **AI Model** | **GROQ (Llama 3.3/Level 4)** | Har bir modul uchun alohida model va prompting mantiqi (Vitality, Finance). | ✅ |

---

## 2. Ma'lumotlar Bazasi Tuzilmasi (Firestore Schema)

Firestore NoSQL bo'lgani uchun biz ma'lumotlarni **Kolleksiyalar (Collections)** va **Hujjatlar (Documents)** ko'rinishida saqlaymiz.

### 2.1. `users` (Foydalanuvchilar) ✅

Har bir foydalanuvchi uchun asosiy profil ma'lumotlari.

```json
users/{userId}
{
  "uid": "user123",
  "email": "ahmad@example.com",
  "displayName": "Ahmad",
  "fullName": "Ahmad Ahmadov",
  "language": "uz", // uz, en, ru
  "photoURL": "https://...",
  "onboardingCompleted": true,
  "createdAt": "Timestamp"
}
```

**Subcollections:**

- `family_members/` - Family tree members (if user is family owner)
- `ancestors/` - Genealogy ancestors
- `parenting_requests/` - Join requests for family groups

### 2.2. `daily_logs` (Kunlik Hisobotlar)
Eng ko'p ishlatiladigan kolleksiya. Har bir kun uchun bitta hujjat ochiladi.
`daily_logs` ni `users` ichida sub-collection qilsak ham bo'ladi, lekin global tahlil uchun alohida turgani ma'qul (Security Rules bilan himoyalanadi).
```json
daily_logs/{logId}
{
  "userId": "user123",
  "date": "2024-05-20", // YYYY-MM-DD
  "mood": {
    "status": "negative", // positive, negative, neutral
    "energyLevel": 4, // 1-10
    "note": "Ishda charchadim"
  },
  "health": {
    "steps": 4500,
    "sleepHours": 6.5,
    "screenTime": 120 // daqiqa
  },
  "finance": {
    "totalSpent": 250000,
    "currency": "UZS"
  },
  "isArchived": false // Tun yarmida true bo'ladi va tahrirlash yopiladi
}
```

### 2.3. `transactions` (Moliya)
Har bir to'lov alohida hujjat.
```json
transactions/{transactionId}
{
  "userId": "user123",
  "amount": 50000,
  "type": "expense", // income, expense
  "category": "food",
  "description": "Tushlik",
  "timestamp": "Timestamp",
  "relatedLogId": "daily_2024_05_20" // Bog'liqlik
}
```

### 2.4. `tasks` (Vazifalar va Fokus)
```json
tasks/{taskId}
{
  "userId": "user123",
  "title": "Hisobot yozish",
  "priority": "high",
  "isCompleted": false,
  "focusSessions": [
    { "duration": 25, "status": "completed" }, // Pomodoro
    { "duration": 10, "status": "failed" }
  ]
}
```

### 2.5. `family_groups` (Oila) ✅

```json
family_groups/{groupId}
{
  "id": "group_abc",
  "name": "Abdullayevlar Oilasi",
  "ownerId": "user123",
  "members": ["user123", "user456", "user789"],
  "createdAt": "Timestamp",
  "deletedAt": null // Soft delete timestamp
}
```

### 2.6. `notifications` (Bildirishnomalar) ✅

```json
notifications/{notificationId}
{
  "userId": "user123",
  "module": "family",
  "type": "join_request",
  "message": "New member requested to join",
  "count": 1,
  "isRead": false,
  "timestamp": "Timestamp"
}
```

### 2.7. `ai_insights` (AI Tahlillari) ✅

Har bir modul uchun generator qilingan JSON tahlillar.
```json
ai_insights/{moduleId}_{date}
{
  "moduleKey": "health",
  "title": "AURA Vitality Protocol",
  "insight": "...",
  "emoji": "🧬",
  "data": {
    "vitalityScore": 85,
    "protocol": ["...", "..."],
    "status": "ready"
  }
}
```

---

## 3. Context Providers (Global State) ✅

React Context API orqali global state management.

### 3.1. AuthContext

**Location:** `/src/context/AuthContext.tsx`

**Purpose:** Firebase authentication state boshqaruvi.

**Functions:**
- `signUp(email, password, displayName)`
- `signIn(email, password)`
- `signInWithGoogle()`
- `logOut()`

**Hook:**
```typescript
const { user, loading } = useAuth();
```

### 3.2. LanguageContext

**Location:** `/src/context/LanguageContext.tsx`

**Purpose:** Multi-language support (EN, UZ, RU).

**Functions:**
- `changeLanguage(lang: 'en' | 'uz' | 'ru')`

**Hook:**
```typescript
const { t, language, changeLanguage } = useLanguage();
```

**Usage:**
```typescript
<h1>{t.home.welcome}</h1>
```

### 3.3. NotificationContext

**Location:** `/src/context/NotificationContext.tsx`

**Purpose:** Real-time badge notifications.

**Functions:**
- `incrementNotification(module: string)`
- `clearNotification(module: string)`
- `getNotificationCount(module: string): number`

**Hook:**
```typescript
const { notifications, clearNotification } = useNotifications();
```

---

## 4. Real-time Synchronization ✅

### 4.1. Firestore Listeners

AURA uses Firestore real-time listeners for live data updates.

**Pattern:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'collection'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setData(data);
    }
  );
  
  return () => unsubscribe();
}, []);
```

**Used In:**
- Family module (members, groups, requests)
- Notifications (badge counts)
- Real-time collaboration features

### 4.2. Subscription Functions

**Family Service Examples:**
```typescript
subscribeToFamilyGroup(groupId, callback);
subscribeToFamilyMembers(ownerId, callback);
subscribeToUserFamilies(userId, callback);
```

**Auto-cleanup:** React `useEffect` cleanup handles unsubscribe.

---

## 5. "Cloud Functions" Mantiqi (AURA AI Core) ✅

Biz serverless **Firebase Cloud Functions (v2)** dan foydalanib, Groq AI arxitekturasini qurdik.

### 5.1. Scheduled Functions (Schedulers) ✅

1.  **`dailyArchive` (Har kuni 23:59 da)**
    *   **Vazifa:** Barcha `daily_logs` hujjatlarini tekshiradi. `isArchived: true` qilib belgilaydi.
2.  **`dailyAIAnalysis` (Zamon oynalari bo'yicha)**
    *   **Vazifa:** Navbatma-navbat barcha modullarni tahlil qilish (Finance, Health, Task, hk).

### 5.2. AI Endpoints (HTTP v2 Gen) ✅

1.  **`getHealthInsight`**
    *   **Vazifa:** AURA Vitality Strategist tahlili.
2.  **`getFinanceInsight`**
    *   **Vazifa:** Moliya tahlili va tejash strategiyasi.
3.  **`getTranscription`**
    *   **Vazifa:** GROQ Whisper modelini ishlash (Ovozli transkripsiya).
    *   **Key Rotation:** Ko'p API kalitli tizim (Fallback).
4.  **`getFoodAnalysis`**
    *   **Vazifa:** GROQ Vision orqali taom tahlili.

---

## 6. Loyiha Strukturasi (Project Structure) ✅

Biz **Monorepo** usuliga yaqin strukturadan foydalanamiz, lekin soddalik uchun papkalarni ajratamiz:

```
AURA/
├── app/                      # React Native (Expo) - Mobil Ilova 🔴
│   ├── assets/
│   ├── src/
│   │   └── screens/
│   └── app.json
│
├── web/                      # Next.js 14 - Dashboard ✅
│   ├── src/
│   │   ├── app/              # App Router (Next.js 14)
│   │   │   ├── page.tsx      # Landing page
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx  # Dashboard home
│   │   │       ├── finance/
│   │   │       ├── health/
│   │   │       ├── mind/
│   │   │       ├── focus/
│   │   │       ├── tasks/
│   │   │       ├── food/
│   │   │       ├── interests/
│   │   │       ├── family/
│   │   │       │   ├── page.tsx
│   │   │       │   └── genealogy/
│   │   │       └── settings/
│   │   │
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Modal.tsx
│   │   │   ├── CalendarModal.tsx
│   │   │   ├── HistoryModal.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── FamilyTree.tsx
│   │   │   ├── ButterflyEffectWidget.tsx
│   │   │   └── dashboard/
│   │   │       ├── DateNavigator.tsx
│   │   │       └── SmartOnboarding.tsx
│   │   │
│   │   ├── context/          # Global state providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── LanguageContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   │
│   │   ├── services/         # Firestore service layer
│   │   │   ├── financeService.ts
│   │   │   ├── healthService.ts
│   │   │   ├── mindService.ts
│   │   │   ├── focusService.ts
│   │   │   ├── tasksService.ts
│   │   │   ├── foodService.ts
│   │   │   ├── interestsService.ts
│   │   │   ├── familyService.ts
│   │   │   ├── dailyService.ts
│   │   │   └── userService.ts
│   │   │
│   │   ├── hooks/
│   │   │   └── useVoiceCommand.ts
│   │   │
│   │   └── firebaseConfig.ts
│   │
│   ├── public/
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/                  # Firebase Cloud Functions 🔴
│   ├── functions/            # (Not yet implemented)
│   │   ├── src/
│   │   └── index.ts
│   └── firestore.rules
│
└── docs/                     # Documentation ✅
    ├── AURA - PRD.md (v2.1)
    ├── Implementation_Status.md
    ├── API_Documentation.md
    ├── Technical_Architecture.md (v2.0)
    └── ... (other docs)
```

## 7. Xavfsizlik (Security Rules) ✅

### 7.1. User Data Protection

Faqat o'z egasi o'qishi mumkin:

```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /daily_logs/{logId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}

match /tasks/{taskId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

### 7.2. Family Groups

Oila a'zolari uchun maxsus `read` ruxsatlari:

```javascript
match /family_groups/{groupId} {
  // Members can read
  allow read: if request.auth.uid in resource.data.members;
  
  // Only owner can write
  allow write: if request.auth.uid == resource.data.ownerId;
}

match /users/{ownerId}/family_members/{memberId} {
  // Family owner can read/write
  allow read, write: if request.auth.uid == ownerId;
  
  // Member can read own profile
  allow read: if request.auth.uid == memberId;
}
```

### 7.3. Validation Rules

```javascript
// Ensure data integrity
match /tasks/{taskId} {
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.title is string
    && request.resource.data.title.size() > 0;
}
```

---

## 8. Service Layer Architecture ✅

Barcha Firestore operatsiyalari `/src/services/` papkasida abstraksiya qilingan.

### 8.1. Pattern

```typescript
// CRUD operations
export async function getData(userId: string) {
  try {
    const docRef = doc(db, 'collection', userId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateData(userId: string, updates: any) {
  const docRef = doc(db, 'collection', userId);
  await updateDoc(docRef, updates);
}
```

### 8.2. Real-time Subscriptions

```typescript
export function subscribeToData(
  userId: string,
  callback: (data: any) => void
): () => void {
  const docRef = doc(db, 'collection', userId);
  
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    callback(snapshot.data());
  });
  
  return unsubscribe;
}
```

**Batafsil ma'lumot:** [API_Documentation.md](file:///d:/AURA/docs/API_Documentation.md)

---

## 9. Deployment Strategy

### 9.1. Web Platform ✅

**Hosting Options:**
- **Vercel** (recommended for Next.js)
- Firebase Hosting (alternative)

**Build Command:**
```bash
npm run build
```

**Environment Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 9.2. Backend 🔴

**Firebase Functions Deploy:**
```bash
cd backend/functions
npm run build
firebase deploy --only functions
```

**Cron Jobs:**
Use Firebase Pub/Sub scheduled functions.

### 9.3. Mobile App 🔴

**iOS:**
```bash
eas build --platform ios
```

**Android:**
```bash
eas build --platform android
```

---

## 10. Performance Optimization ✅

### 10.1. Next.js Optimizations

- **Server Components:** Default in Next.js 14 App Router
- **Image Optimization:** `next/image` component
- **Code Splitting:** Automatic route-based splitting
- **Font Optimization:** `next/font` for Google Fonts

### 10.2. Firestore Optimization

- **Indexes:** Composite indexes for complex queries
- **Pagination:** Limit queries to reduce read costs
- **Caching:** Use `getFromCache()` when appropriate
- **Batched Writes:** Group writes together

### 10.3. Real-time Listeners

- **Scoped Subscriptions:** Only subscribe to needed data
- **Cleanup:** Always unsubscribe in `useEffect` cleanup
- **Debouncing:** Limit update frequency for UI

---

## Xulosa

AURA v2.0+ to'liq ishga tushdi:

✅ **Web Dashboard:** Production Ready (Premium UI)
✅ **Real-time Sync:** Firestore listeners & Cloud Functions v2  
✅ **AURA AI Core:** Groq-powered robust backend with key rotation
✅ **Deployment:** [aura-life-os.web.app](https://aura-life-os.web.app/)  
🚧 **Mobile:** Mobile App (Stage 2)

**Batafsil Hujjatlar:**
- [PRD v2.1](file:///d:/AURA/docs/AURA%20-%20PRD.md)
- [Implementation Status](file:///d:/AURA/docs/Implementation_Status.md)
- [API Documentation](file:///d:/AURA/docs/API_Documentation.md)
