# AURA - API Documentation

**Version:** 2.5  
**Last Updated:** 2026-01-25  
**Platform:** Web (Next.js + Firebase) + Backend (Cloud Functions v2)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Finance Service](#finance-service)
5. [Health Service](#health-service)
6. [Mind Service](#mind-service)
7. [Focus Service](#focus-service)
8. [Tasks Service](#tasks-service)
9. [Food Service](#food-service)
10. [Interests Service](#interests-service)
11. [Family Service](#family-service)
12. [Daily Service](#daily-service)
13. [User Service](#user-service)
14. [Firestore Collections](#firestore-collections)
15. [Error Handling](#error-handling)
16. [TypeScript Types](#typescript-types)

---

## Overview

AURA web platform uses a **service layer architecture** to interact with Firebase Firestore. All database operations are abstracted into service functions located in `/src/services/`.

### Architecture Pattern

```
Component → Service Function → Firestore → Service Function → Component
```

### Key Principles

- **Single Responsibility:** Each service handles one module
- **Type Safety:** All functions use TypeScript interfaces
- **Error Handling:** Try-catch blocks with console logging
- **Real-time Support:** Subscription functions for live updates
- **Data Validation:** Input validation before writes

---

## Authentication

### AuthContext

**Location:** `/src/context/AuthContext.tsx`

Provides Firebase authentication state globally.

#### Available Hooks

```typescript
const { user, loading } = useAuth();
```

**Returns:**
- `user`: Firebase User object or null
- `loading`: boolean (auth state initialization)

#### Functions

##### `signUp(email, password, displayName)`

Register new user with email/password.

```typescript
await signUp(
  "user@example.com",
  "password123",
  "John Doe"
);
```

##### `signIn(email, password)`

Login existing user.

```typescript
await signIn("user@example.com", "password123");
```

##### `signInWithGoogle()`

Login with Google OAuth.

```typescript
await signInWithGoogle();
```

##### `logOut()`

Sign out current user.

```typescript
await logOut();
```

---

## Service Layer Architecture

### Common Patterns

All services follow these patterns:

#### 1. CRUD Operations

```typescript
// Create
const id = await createItem(userId, data);

// Read
const item = await getItem(userId, itemId);

// Update
await updateItem(userId, itemId, updates);

// Delete
await deleteItem(userId, itemId);
```

#### 2. Date-based Queries

```typescript
const data = await getDataByDate(userId, "2026-01-15");
```

#### 3. Real-time Subscriptions

```typescript
const unsubscribe = subscribeToData(userId, (data) => {
  console.log("Data updated:", data);
});

// Later: cleanup
unsubscribe();
```

---

## Finance Service

**Location:** `/src/services/financeService.ts`

### Types

```typescript
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  timestamp: Timestamp;
}

interface FinanceOverview {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  transactions: Transaction[];
}
```

### Functions

#### `getFinanceOverview(userId: string): Promise<FinanceOverview | null>`

Get finance summary for user.

**Parameters:**
- `userId` (string): User ID

**Returns:** FinanceOverview or null

**Example:**
```typescript
const overview = await getFinanceOverview("user123");
console.log(overview.totalBalance); // 1500.00
```

#### `addTransaction(userId, transaction): Promise<string>`

Add new income or expense.

**Parameters:**
- `userId` (string): User ID
- `transaction` (Partial<Transaction>): Transaction data

**Returns:** Transaction ID

**Example:**
```typescript
const id = await addTransaction("user123", {
  amount: 50.00,
  type: 'expense',
  category: 'food',
  description: 'Lunch',
  date: '2026-01-15'
});
```

#### `updateTransaction(userId, transactionId, updates): Promise<void>`

Update existing transaction.

#### `deleteTransaction(userId, transactionId): Promise<void>`

Delete a transaction.

#### `seedFinanceData(userId): Promise<FinanceOverview>`

Create mock data for testing (development only).

---

## Health Service

**Location:** `/src/services/healthService.ts`

### Types

```typescript
interface HealthData {
  userId: string;
  date: string;
  steps: number;
  sleepHours: number;
  screenTime: number;
  bodyBattery: {
    current: number;
    max: number;
  };
  biometrics?: {
    height: number; // cm
    weight: number; // kg
    goal: 'lose' | 'gain' | 'maintain';
  };
}
```

### Functions

#### `getHealthData(userId, date): Promise<HealthData | null>`

Get health data for specific date.

**Example:**
```typescript
const health = await getHealthData("user123", "2026-01-15");
console.log(health.bodyBattery.current); // 85
```

#### `updateHealthData(userId, date, data): Promise<void>`

Update health metrics.

**Example:**
```typescript
await updateHealthData("user123", "2026-01-15", {
  biometrics: {
    height: 175,
    weight: 70,
    goal: 'maintain'
  }
});
```

#### `updateBodyBattery(userId, date, value): Promise<void>`

Update body battery value (0-100).

#### `seedHealthData(userId, date): Promise<HealthData>`

Create mock health data.

---

## Mind Service

**Location:** `/src/services/mindService.ts`

### Types

```typescript
interface MindData {
  userId: string;
  date: string;
  mood: 'positive' | 'negative' | 'neutral';
  energyLevel: number; // 1-10
  note?: string;
  timestamp: Timestamp;
}
```

### Functions

#### `getMindData(userId, date): Promise<MindData | null>`

Get mental health data for date.

#### `logMood(userId, date, moodData): Promise<void>`

Log daily mood.

**Example:**
```typescript
await logMood("user123", "2026-01-15", {
  mood: 'positive',
  energyLevel: 8,
  note: 'Great day at work!'
});
```

---

## Focus Service

**Location:** `/src/services/focusService.ts`

### Types

```typescript
interface FocusSession {
  id: string;
  userId: string;
  duration: number; // minutes
  actualDuration?: number;
  status: 'completed' | 'failed' | 'in_progress';
  startTime: Timestamp;
  endTime?: Timestamp;
  distractions: number;
  taskId?: string; // linked task
}
```

### Functions

#### `startFocusSession(userId, duration, taskId?): Promise<string>`

Start new focus timer.

**Parameters:**
- `userId` (string)
- `duration` (number): Timer duration in minutes
- `taskId` (string, optional): Linked task ID

**Returns:** Session ID

#### `completeFocusSession(sessionId): Promise<void>`

Mark session as completed.

#### `failFocusSession(sessionId): Promise<void>`

Mark session as failed (stopped early).

#### `getFocusSessions(userId, date): Promise<FocusSession[]>`

Get all focus sessions for a date.

---

## Tasks Service

**Location:** `/src/services/tasksService.ts`

### Types

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'done';
  date: string; // YYYY-MM-DD
  timeStart?: string; // HH:MM
  timeEnd?: string; // HH:MM
  focusSessionId?: string;
  parentId?: string | null; // Recursive parent
  parentTitle?: string | null;
  subtasks?: SubTask[]; // Nested subtasks
  createdAt: Timestamp;
}

interface SubTask extends Omit<Task, 'subtasks'> {
  parentId: string;
}

interface TasksByCategory {
  overdue: Task[];
  today: Task[];
  future: Task[];
}
```

### Functions

#### `getTasks(userId, date): Promise<Task[]>`

Get all tasks for a specific date.

#### `getTasksByCategory(userId, date): Promise<TasksByCategory>`

Get tasks organized by category (overdue, today, future).

**Example:**
```typescript
const categorized = await getTasksByCategory("user123", "2026-01-15");
console.log(categorized.overdue.length); // 3
console.log(categorized.today.length); // 5
```

#### `createTask(userId, taskData): Promise<string>`

Create new task.

**Example:**
```typescript
const taskId = await createTask("user123", {
  title: "Finish report",
  description: "Complete Q4 analysis",
  priority: 'high',
  date: '2026-01-16',
  timeStart: '09:00',
  timeEnd: '11:00'
});
```

#### `updateTask(taskId, updates): Promise<void>`

Update task fields.

#### `toggleTaskStatus(taskId): Promise<void>`

Toggle between 'todo' and 'done'.

#### `deleteTask(taskId): Promise<void>`

Delete a task.

#### `moveTask(taskId, newDate): Promise<void>`

Move task to different date.

#### `getAllRelatedTasks(focusedTask, allTasks, deep = false): Task[]`

Unified helper to retrieve all subtasks (direct or flattened) for a specific task context.

---

## Food Service

**Location:** `/src/services/foodService.ts`

### Types

```typescript
interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  imageUrl?: string;
  timestamp: Timestamp;
}

interface FoodDayLog {
  userId: string;
  date: string;
  meals: FoodEntry[];
  summary: {
    calories: {
      current: number;
      target: number;
    };
  };
}
```

### Functions

#### `getFoodLog(userId, date): Promise<FoodDayLog | null>`

Get food log for specific date.

#### `addFoodEntry(userId, date, entry): Promise<string>`

Add food item.

**Example:**
```typescript
await addFoodEntry("user123", "2026-01-15", {
  name: "Chicken Salad",
  calories: 450,
  imageUrl: "https://..."
});
```

#### `deleteFoodEntry(userId, date, entryId): Promise<void>`

Remove food entry.

#### `uploadFoodImage(file): Promise<string>`

Upload food image to Firebase Storage.

**Parameters:**
- `file` (File): Image file

**Returns:** Download URL

---

## Interests Service

**Location:** `/src/services/interestsService.ts`

### Types

```typescript
interface Interest {
  id: string;
  name: string;
  category: string;
  startDate: string;
  isActive: boolean;
  lastPracticed?: string;
}

interface InterestsData {
  userId: string;
  interests: Interest[];
  stats: {
    totalActive: number;
    learningStreak: number;
  };
}
```

### Functions

#### `getInterestsData(userId): Promise<InterestsData | null>`

Get all user interests.

#### `addInterest(userId, interest): Promise<string>`

Add new hobby/interest.

**Example:**
```typescript
await addInterest("user123", {
  name: "Guitar",
  category: "Music",
  startDate: "2026-01-15",
  isActive: true
});
```

#### `toggleInterestStatus(userId, interestId): Promise<void>`

Toggle active/paused status.

#### `deleteInterest(userId, interestId): Promise<void>`

Remove interest.

---

## Family Service

**Location:** `/src/services/familyService.ts`

### Types

```typescript
interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // userIds
  createdAt: Timestamp;
  deletedAt?: Timestamp;
}

interface FamilyMember {
  id: string;
  name: string;
  fullName: string;
  birthDate: string;
  role: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  coins: number;
  level: number;
  status: string;
  mood: string;
  profession?: string;
  education?: string;
  bio?: string;
}

interface ParentingRequest {
  id: string;
  familyGroupId: string;
  requesterId: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Timestamp;
}

interface Ancestor {
  id: string;
  fullName: string;
  birthDate: string;
  deathDate?: string;
  relation: string;
  biography?: string;
}
```

### Constants

```typescript
const FAMILY_ROLES = [
  'Grandfather', 'Grandmother',
  'Father', 'Mother',
  'Brother', 'Younger Brother',
  'Sister', 'Younger Sister',
  'Son', 'Daughter',
  'Uncle (Father side)', 'Uncle (Mother side)',
  'Aunt (Father side)', 'Aunt (Mother side)',
  'Nephew', 'Niece',
  'Cousin', 'Other'
];
```

### Group Management Functions

#### `getFamilyGroups(userId): Promise<FamilyGroup[]>`

Get all family groups user is member of.

#### `createFamilyGroup(userId, name, ownerProfile): Promise<string>`

Create new family group.

**Parameters:**
- `userId` (string): Creator's user ID
- `name` (string): Family group name
- `ownerProfile` (object):
  - `fullName` (string)
  - `birthDate` (string)
  - `role` (string)

**Returns:** Group ID

**Example:**
```typescript
const groupId = await createFamilyGroup("user123", "Ahmadov Family", {
  fullName: "Ahmad Ahmadov",
  birthDate: "1980-05-15",
  role: "Father"
});
```

#### `updateFamilyGroup(groupId, updates): Promise<void>`

Update group name.

#### `deleteFamilyGroup(groupId, userId): Promise<void>`

Soft delete (archive) family group.

#### `restoreFamilyGroup(groupId): Promise<void>`

Restore deleted group (within 30 days).

### Member Management Functions

#### `getFamilyMembers(ownerId): Promise<FamilyMember[]>`

Get all members in family tree (from owner's perspective).

#### `updateFamilyMember(ownerId, memberId, updates): Promise<void>`

Update member profile.

**Example:**
```typescript
await updateFamilyMember("owner123", "member456", {
  fullName: "Updated Name",
  profession: "Engineer",
  fatherId: "father789"
});
```

#### `removeMemberFromGroup(groupId, memberId, ownerId): Promise<void>`

Remove member from family (kick).

#### `addCoins(ownerId, memberId, amount): Promise<void>`

Add coins to member (gamification).

### Join Request Functions

#### `requestJoinFamily(userId, groupId): Promise<void>`

Send request to join existing family.

#### `getParentingRequests(ownerId): Promise<ParentingRequest[]>`

Get pending join requests (for family owner).

#### `approveJoinRequest(ownerId, groupId, requesterId, role, linkage): Promise<void>`

Approve join request and add member.

**Parameters:**
- `ownerId` (string): Family owner ID
- `groupId` (string): Group ID
- `requesterId` (string): User requesting to join
- `role` (string): Family role to assign
- `linkage` (object):
  - `fatherId` (string, optional)
  - `motherId` (string, optional)

**Example:**
```typescript
await approveJoinRequest(
  "owner123",
  "group456",
  "requester789",
  "Son",
  { fatherId: "owner123" }
);
```

#### `updateRequestStatus(ownerId, requestId, status): Promise<void>`

Update request status (approve/reject).

### Real-time Subscriptions

#### `subscribeToFamilyGroup(groupId, callback): () => void`

Listen to group updates.

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsubscribe = subscribeToFamilyGroup("group123", (group) => {
  console.log("Group updated:", group.name);
});

// Cleanup
unsubscribe();
```

#### `subscribeToUserFamilies(userId, callback): () => void`

Listen to all families user is member of.

#### `subscribeToFamilyMembers(ownerId, callback): () => void`

Listen to member list changes.

#### `subscribeToDeletedFamilies(userId, callback): () => void`

Listen to soft-deleted families.

### Helper Functions

#### `ensureOwnerProfile(userId): Promise<void>`

Auto-create owner's member profile if missing.

#### `upsertMemberProfile(ownerId, memberId, data): Promise<void>`

Create or update member profile.

#### `upsertAncestor(ownerId, ancestorData): Promise<string>`

Add/update ancestor (genealogy tree).

---

## Daily Service

**Location:** `/src/services/dailyService.ts`

### Functions

#### `checkAndArchivePreviousDays(userId): Promise<void>`

Check all previous dates and archive them.

**Usage:** Called on dashboard mount to ensure data consistency.

**Logic:**
```typescript
// Sets isArchived: true for all dates before today
// Prevents editing of past data
```

---

## User Service

**Location:** `/src/services/userService.ts`

### Types

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  language: 'en' | 'uz' | 'ru';
  photoURL?: string;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
}
```

### Functions

#### `getUserProfile(userId): Promise<UserProfile | null>`

Get user profile from Firestore.

#### `createUserProfile(userId, data): Promise<void>`

Create new user profile (called on signup).

#### `updateUserProfile(userId, updates): Promise<void>`

Update user profile fields.

**Example:**
```typescript
await updateUserProfile("user123", {
  language: 'uz',
  fullName: 'Ahmad Ahmadov',
  onboardingCompleted: true
});
```

---

## Firestore Collections

### Collection Structure

```
firestore/
├── users/
│   ├── {userId}/
│   │   ├── profile (document)
│   │   ├── family_members/ (subcollection)
│   │   │   └── {memberId}
│   │   ├── ancestors/ (subcollection)
│   │   │   └── {ancestorId}
│   │   └── parenting_requests/ (subcollection)
│   │       └── {requestId}
│
├── family_groups/
│   └── {groupId}
│
├── daily_logs/
│   └── {userId}_{date}
│
├── transactions/
│   └── {transactionId}
│
├── tasks/
│   └── {taskId}
│
├── focus_sessions/
│   └── {sessionId}
│
└── notifications/
    └── {notificationId}
```

### Security Rules (Summary)

```javascript
// User can only access own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Family members can read shared family data
match /family_groups/{groupId} {
  allow read: if request.auth.uid in resource.data.members;
  allow write: if request.auth.uid == resource.data.ownerId;
}

// Tasks are user-specific
match /tasks/{taskId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

---

## Error Handling

### Standard Pattern

All service functions use try-catch:

```typescript
export async function someFunction(userId: string) {
  try {
    // Firestore operations
    const docRef = doc(db, 'collection', userId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.data();
  } catch (error) {
    console.error("Error in someFunction:", error);
    throw error; // Re-throw for component handling
  }
}
```

### Component Usage

```typescript
try {
  const data = await someFunction(userId);
  if (!data) {
    console.log("No data found");
  }
} catch (error) {
  alert("An error occurred: " + error.message);
}
```

---

## TypeScript Types

### Import Locations

```typescript
// Firebase types
import { Timestamp } from 'firebase/firestore';

// Service types
import type { 
  Transaction, 
  FinanceOverview 
} from '@/services/financeService';

import type { 
  Task, 
  TasksByCategory 
} from '@/services/tasksService';

import type { 
  FamilyGroup, 
  FamilyMember 
} from '@/services/familyService';
```

### Generic Response Types

```typescript
// Success with data
type ServiceResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// Async function returning data or null
type MaybeNull<T> = Promise<T | null>;
```

---

## Best Practices

### 1. Always Check Auth

```typescript
const { user } = useAuth();
if (!user) return;

await someFunction(user.uid);
```

### 2. Use Real-time When Needed

For collaborative features (Family module):

```typescript
useEffect(() => {
  if (!groupId) return;
  
  const unsubscribe = subscribeToFamilyMembers(groupId, (members) => {
    setMembers(members);
  });
  
  return () => unsubscribe();
}, [groupId]);
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getData(userId);
      setData(data);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [userId]);
```

### 4. Validate Before Write

```typescript
if (!taskTitle.trim()) {
  alert("Title is required");
  return;
}

await createTask(userId, { title: taskTitle, ... });
```

### 5. Use Date Formatting

```typescript
// Always use YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];
```

---

## Future API (Planned)

### Cloud Functions (Backend)

**Not yet implemented. See PRD v2.1 Section 15.**

```typescript
// Future: AI Analysis Functions
interface AnalysisResult {
  module: string;
  insights: string[];
  recommendations: string[];
  timestamp: Timestamp;
}

// These will be callable functions
export const analyzeFinanceDaily = httpsCallable<void, AnalysisResult>(
  functions, 
  'analyzeFinance'
);

export const processVoiceCommand = httpsCallable<
  { audio: string },
  { intent: string, module: string, data: any }
>(functions, 'processVoiceCommand');
```

---

## Changelog

### v1.0 (2026-01-15)

- Initial API documentation
- All major services documented
- TypeScript types included
- Security rules summary
- Best practices guide

---

*For implementation details, see source code in `/src/services/`*  
*For architecture overview, see [Technical_Architecture.md](file:///d:/AURA/docs/Technical_Architecture.md)*
