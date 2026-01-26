# Changelog

All notable changes to the AURA project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v2.0.0-stable] (2026-01-25) - AURA AI Core & Premium Vitality 🧬✨

- **AURA AI Core (Backend Revolution)**:
    - **Cloud Functions v2**: To'liq serverless backend arxitekturasi ishga tushirildi.
    - **Intelligent Cache & Persistence**: AI tahlillari Firestore'da saqlanadi va real-vaqtda sinxronizatsiya qilinadi.
    - **API Key Rotation & Fallback**: Bir nechta GROQ API kalitlari bilan ishlovchi, bardoshli (robust) tizim. Agar bitta kalit xato bersa, tizim avtomatik boshqasiga o'tadi.
- **Premium Health UI (Vitality Strategist)**:
    - **Vitality Matrix v2.0**: Sog'liq sahifasi butunlay yangilandi. Glassmorphism, premium gradientlar va silliq animatsiyalar.
    - **Optimization Protocol**: AI endi aniq bosqichma-bosqich harakatlar rejasini (Action Steps) taqdim etadi.
    - **Vitality Score**: Umumiy hayotiylik darajasini ko'rsatuvchi interaktiv progress-bar.
- **Voice AI Improvements**:
    - **Module-Aware Transcription**: Ovozni matnga o'girishda endi modulga xos API kalitlari ishlatiladi (masalan, Moliya moduli uchun alohida kalit).
    - **Auto-Retry Logic**: Transkripsiya xatolari 100% kamaytirildi.
- **Production Deployment**:
    - **Firebase Hosting**: Loyiha [aura-life-os.web.app](https://aura-life-os.web.app/) manziliga to'liq deploy qilindi.
    - **Successive Build**: Next.js 16 build va deploy jarayoni optimallashtirildi.

---

## [Unreleased]

### Planned
- Mobile app (React Native) development
- Butterfly Effect calculations engine
- Smart Parenting advanced rewards system

---

## v1.8.0-beta (2026-01-19) - Finance V18: Full Localization & Polish 🌍✨
- **Multi-Language Support (100%)**:
    - **UZ/RU/EN**: Finance moduli endi to'liq 3 tilda ishlaydi.
    - **Dynamic Localization**: Barcha sarlavhalar, tugmalar, modallar va AI javoblari tanlangan tilga moslashadi.
- **Visual Audit Fixes**:
    - "Portfolio", "AI Wealth Roadmap", "Prediction" va "Charts" bo'limlaridagi barcha qattiq yozilgan matnlar tarjima qilindi.
    - Top Nav va valyuta vidjetlari tilga moslashtirildi.
- **Improved UX**: Bo'sh holatlar (Empty States) va xato xabarlari endi do'stona va tushunarli.

## v1.7.0-beta (2026-01-19) - Finance V17: Bank-Grade Kredit & UX Polish 🏦✨
- **Kredit Tizimi (Bank darajasida)**: Yillik foiz, muddat va hisoblash usuli (Annuitet/Differensial) asosida kreditni to'liq boshqarish.
- **Avtomatik Jadval**: Kredit uchun oylik to'lovlar jadvalini avtomatik yaratish va saqlash.
- **Qarz Oqimi (Cash Flow)**:
    - Qarz Olish = Kirim (Daromad) sifatida qayd etiladi.
    - Qarz Berish = Chiqim (Xarajat) sifatida qayd etiladi.
- **Omonat Kirimi**: Omonat ochilganda kiritilgan summa avtomatik ravishda Kirim sifatida qayd etiladi.
- **Global Valyuta Nazorati**: Asosiy Maqsad kartasidagi valyuta tanlovi butun panel (Daromad/Xarajat) statistikasini boshqaradi.
- **UX Yaxshilanishlar**: Maqsad kartasida dinamik xabarlar va bo'sh holatlar uchun tushunarli matnlar.

## v1.6.0-beta (2026-01-19) - Finance V16: Ko'p Valyutali Tizim & Omonatlar 🏦🌐
- **Ko'p Valyutali Statistika**: Barcha daromad va xarajatlarni UZS, USD, EUR yoki RUB da ko'rish imkoniyati.
- **Omonat (Deposit) Tizimi**:
    - Yillik foiz va muddat asosida foyda hisoblash.
    - Avtomatik "Payout Schedule" (to'lov jadvali) yaratish.
    - Omonat ochilganda "Investitsiya" xarajati sifatida yozish.
- **Qarz Oqimi (Cash Flow Integration)**:
    - Qarz olish -> Daromad (Income).
    - Qarz to'lash -> Xarajat (Expense).

## v1.5.0-beta (2026-01-19) - Finance V14: Advanced Banking & Localization 🏦🌍
- **Banking Calculation Engine**:
    - **Credits**: Added "Annuity" (Equal payments) and "Differential" (Decreasing) calculation methods.
    - **Deposits**: Added "Annual Interest Rate" tracking for savings growth calculations.
    - **Inputs**: New fields for Interest Rate (%), Term (Months), and Calculation Method in Modals.
- **Localization & Rates**:
    - **Live Rate Simulator**: Added Dashboard Widget showing real-time Central Bank rates (USD/EUR/RUB).
    - **Language Support**: Exchange rates adapt to selected region references.
- **UI Improvements**: Fixed currency dropdown visibility in dark mode.

## v1.4.0-beta (2026-01-19) - Finance V13: Portfolio & Recurring Obligations 💳💰
- **Financial Portfolio**: Renamed "Qarzlar" to "Portfolio". Now tracks Debts, Credits, and Deposits in one view.
- **Credits (Loans)**: Track recurring loan payments (Mortgage, Installments). Automated "Due Date" reminders.
- **Deposits (Savings)**: Track recurring savings goals. Automated reminders to contribute to savings.
- **Smart Logic**:
    - **Liabilities**: Calculates total Debts + Remaining Credit Balance.
    - **Assets**: Calculates total Owed Returns + Deposit Balances.
    - **Reminders**: Highlights payments due based on the current date of the month.

## v1.3.1-beta (2026-01-19) - Finance V12.1 Debt Enhancements
- **Smart Debt Repayment**: Added "Qaytarildi" (Repaid) button which automatically updates your balance (Income/Expense effect).
- **Deadline Logic**: Mandatory "Start Date" and "Deadline" fields for all debts.
- **Extension Flow**: Added "Uzaytirish" (Extend) option to easily change deadlines.

## v1.3.0-beta (2026-01-19) - Finance V12: Qarzlar Daftari 📒
- **Debt Management**: Added specific module for tracking debts ("Men Qarzdorman" and "Mendan Qarz").
- **Asset/Liability**: Debts flow into a separate Liability/Asset calculation, not affecting monthly Income/Expense stats.
- **Debt Dashboard**: Visualize total debt and receivables with simple "Add Debt" interface.

## v1.2.7-beta (2026-01-19) - Finance V11.5 UX Improvements
- **Transaction List**: Items are now sorted by Time (Newest First) instead of Amount, making it easier to see recent activity.
- **AI Projection**: Added detailed breakdown of the math (Target - Current / Net Income) so "Years to Goal" is transparent and understandable.

## v1.2.6-beta (2026-01-19) - Finance V11.4 Logic Fixes
- **Goal AI Projection**: Fixed "Probability" calculation to account for currency differences (e.g. Savings in UZS vs Goal in USD).
- **Goal Edit Modal**: Fixed issue where the modal date would default to 2027 instead of the actual set deadline.

## v1.2.5-beta (2026-01-19) - Finance V11.3 Unified UX
- **Unified Stats**: "Monthly" and "Custom" views now feature the same detailed Bar Chart and Transaction List as the Weekly view.
- **Dark Mode Calendar**: Fixed Date Picker visual style to match the dark theme.
- **Documentation**: Updated PRD to v2.4 reflecting real-data integration and new features.

## v1.2.4-beta (2026-01-19) - Finance V11.2 Hotfix
- **Goal Card**: Fixed logic to display the actual Financial Target Amount (e.g., "1 000 000 USD") instead of the default placeholder/title once set.

## v1.2.3-beta (2026-01-19) - Finance V11.1 Refinements
- **Weekly Detailed View**: Statistics now show a daily bar chart breakdown + detailed transaction list for the selected week.
- **UI Improvements**: Fixed Goals Currency Dropdown visibility and improved default Goal Card title.
- **Service Update**: Enhanced statistics API to return granular data.

## v1.2.2-beta (2026-01-16) - Finance V11 Enhancements
- **Formatted Inputs**: ALL financial inputs now support space-separated formatting (e.g., 1 000 000).
- **Goal AI Analytics**: Added "Time Remaining" (Months/Weeks/Days) and "Projected Completion" based on savings rate.
- **Custom Stats Range**: Added Date Pickers (From-To) for precise statistical analysis.
- **Goal Currency**: Explicit visual currency selector for the Ultimate Goal.

## v1.2.1-beta (2026-01-16) - Finance V10.5 Refinements
- **Multi-Currency Support**: Added support for UZS, USD, EUR, and RUB in transactions.
- **Goal Editing**: Users can now edit their $1M goal target and deadline.
- **Advanced Statistics**: Added Weekly, Monthly, and Custom tabs for better financial analysis.
- **Voice AI Upgrade**: Improved currency detection in voice commands.

## v1.2.0-beta (2026-01-16) - Finance Revolution (V10)

#### Finance Module (v10.0)
- **Dual-Budgeting System**: Separate tracking for Income Targets and Expense Limits with real-time progress bars.
- **Advanced Statistics Engine**: Weekly and monthly aggregation with category-wise breakdown and custom range support.
- **Currency Ticker**: Real-time daily rates for USD, EUR, and RUB integrated into the dashboard.
- **Ultimate Financial Goal ($1M)**: Dedicated tracking system for long-term goals with progress visualization.
- **AI Wealth Roadmap**: Career-driven financial pathing based on user profession, education, and interests.
- **QR Receipt Framework**: Foundation for QR-based expense generation and receipt processing.
- **Refined AI Logic**: Enhanced voice command parsing for multi-language (EN/UZ/RU) verbatim transcription.

---

## [1.1.0-beta] - 2026-01-16

### Added - Advanced Task & Family Features

#### Tasks Module (v9.0 - v9.3.5)
- **Recursive Subtasks**: Implementation of multi-level task nesting (N-levels deep).
- **Focus View Analytics**: Dedicated analytics mirror for focused task hierarchies.
- **Improved Performance**: Optimized task loading with deep hierarchy flattening.
- **Drag-to-Nest**: Support for dragging tasks into other tasks to create sub-dependencies.
- **Deep Statistics**: Accurate tracking of completion percentages across entire task subtrees.
- **Dynamic Task Movement**: Refined logic for moving entire hierarchies between Today/Future.
- **Humanized Time Chart**: Daily task load visualization across a 24-hour cycle.

#### Family Module (v2.1)
- **Genealogy Tree 2.0**: Interactive, real-time synchronized family tree visualization.
- **Member Profile Details**: Expanded profile editing for family members (bio, education, profession).
- **Auto-Healing**: Automatic synchronization of user metadata into family member documents.
- **Enhanced Parent Linkage**: Smart UI for connecting ancestors and descendants.

#### Infrastructure
- **Analytics Engine**: Unified data collection helper for both root and nested tasks.
- **Optimized Firestore Rules**: Secure access for family groups and personal logs.

---

## [1.0.0-beta] - 2026-01-15

### Added - Core Features

#### Modules (Web Dashboard)
- **Finance Module** (95% complete)
  - Income and expense tracking
  - Transaction categorization
  - Daily archiving system
  - Date-based filtering
- **Mind Module** (90% complete)
  - Mood logging (positive/negative/neutral)
  - Energy level tracking (1-10)
  - Optional notes
  - History view
- **Focus Module** (85% complete)
  - Pomodoro timers (5, 10, 15, 20, 25 min)
  - Session tracking and history
  - Failed session marking
  - Deep Work mode with fullscreen UI
  - Ambient sound support
- **Tasks Module** (95% complete)
  - 3-category system (Overdue, Today, Future)
  - Priority levels (Low, Medium, High)
  - Calendar integration with CalendarModal
  - Focus session integration
  - Task movement between categories
- **Food Module** (75% complete)
  - Manual calorie input
  - Camera and gallery upload UI
  - Daily calorie summary
  - Food log history
- **Health Module** (80% complete)
  - Manual biometric input (height, weight, goal)
  - Body battery display
  - Date navigation
- **Interests Module** (90% complete)
  - Hobby tracking
  - Learning streak counter
  - Active/paused status toggle
- **Family Module** (95% complete) ⭐ Most Advanced
  - Multiple family groups (max 3)
  - Create/join/leave workflows
  - Owner permissions and admin rights
  - 18 family roles support
  - Join request approval system
  - Member profile editing
  - Interactive genealogy tree
  - Soft delete with 30-day restore
  - Real-time synchronization
  - Auto-healing (name correction)
  - Smart Parenting (task assignment, rewards)

#### Infrastructure
- **Authentication** (100%)
  - Email/password registration and login
  - Google OAuth integration
  - Protected routes
  - Session management
- **Real-time System** (100%)
  - Firestore listeners for live updates
  - Family module real-time sync
  - Notification badges
  - Multi-device support
- **Localization** (100%)
  - English, Uzbek, Russian support
  - Dynamic language switching
  - LanguageContext with i18n
  - Persistent language preference
- **Notification System** (100%)
  - Badge counters for each module
  - Real-time updates
  - Auto-clear on view
  - NotificationContext management

#### UI Components
- Universal components (12 total):
  - Modal, CalendarModal, HistoryModal
  - CommandPalette (⌘K shortcut)
  - VoiceInput (UI ready)
  - FamilyTree (interactive visualization)
  - ButterflyEffectWidget
  - SmartOnboarding
  - DateNavigator
  - AmbientSound
  - ParentSelector
  - ProtectedRoute

#### Design System
- Dark theme with glassmorphism effects
- Neon accent colors (cyan, purple, gold, green, red)
- Responsive layout (mobile-first)
- Tailwind CSS utility classes
- Custom animations and transitions

### Documentation (Complete)

#### Technical Documentation
- Product Requirements Document (PRD v2.1) - 8,500 words
- Implementation Status Report - 4,500 words
- API Documentation - 6,000 words
- Technical Architecture v2.0 - 3,500 words
- Deployment Guide - 5,000 words

#### Project Documentation
- README.md with comprehensive overview
- CONTRIBUTING.md with development guidelines
- LICENSE (Proprietary)
- .gitignore for Next.js and Firebase
- .env.example template

**Total:** ~30,000 words of documentation

### Technical Stack

#### Frontend
- Next.js 14 (App Router)
- TypeScript 5.x
- React 18
- Tailwind CSS
- React Context API

#### Backend
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Vercel hosting

#### Development Tools
- ESLint
- Prettier
- Git

---

## [0.5.0-alpha] - 2025-12-01

### Added
- Initial project structure
- Firebase configuration
- Basic authentication flow
- Dashboard layout
- First module implementation (Finance)

---

## Project Milestones

### Completed ✅
- [x] Web dashboard core functionality (90%)
- [x] All 7 modules implemented
- [x] Real-time synchronization
- [x] Multi-language support
- [x] Comprehensive documentation

### In Progress 🚧
- [ ] Backend Cloud Functions (10%)
- [ ] AI integration (GROQ API)
- [ ] Testing infrastructure

### Planned 🔴
- [ ] Mobile app (React Native)
- [ ] Voice command AI processing
- [ ] Food image recognition
- [ ] Landing page
- [ ] Production deployment

---

## Version History

- **v1.0.0-beta** (2026-01-15) - Beta release with web dashboard
- **v0.5.0-alpha** (2025-12-01) - Initial alpha release

---

## Contributors

- **Siyovush Abdullayev** - Project Owner & Lead Developer

---

## License

See [LICENSE](LICENSE) file for details.

---

*For detailed release notes and upgrade guides, see the [docs/](docs/) folder.*
