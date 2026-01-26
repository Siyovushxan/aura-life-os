# AURA - AI-Powered Life Operating System

<div align="center">

![AURA Logo](web/public/logo.png)

**Your Personal Life Dashboard Powered by AI**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)](LICENSE)

[🌐 Live Demo](https://aura-life-os.web.app) | [📖 Documentation](docs/) | [🚀 Getting Started](#getting-started)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**AURA** is not just a tracker—it's a **Life Operating System**. Built on the **"Butterfly Effect"** principle, AURA analyzes how your finances, health, and mental state interconnect and influence each other.

### Why AURA?

- 🧠 **AI-Powered Insights**: GROQ AI analyzes patterns across all life modules
- 🔄 **Real-time Sync**: Firestore listeners for instant updates across devices
- 🌍 **Multi-language**: Full support for English, Uzbek, and Russian
- 👨‍👩‍👧‍👦 **Family Management**: Advanced genealogy tracking and smart parenting features
- 📊 **Data-Driven**: Every action tracked, every insight personalized

---

## ✨ Features

### Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| 💰 **Finance** | Income/expense tracking with AI spending analysis | ✅ 95% |
| 🧘 **Mind** | Mental health tracking and mood analysis | ✅ 90% |
| 🎯 **Focus** | Pomodoro timer with distraction tracking | ✅ 85% |
| ✅ **Tasks** | Recursive nesting (N-levels), Focus Analytics, Drag-to-Nest | ✅ 100% |
| 🍎 **Food** | AI-powered food recognition and calorie tracking | ✅ 95% |
| 💪 **Health** | AURA Vitality Strategist (AI-Powered) | ✅ 98% |
| 🎨 **Interests** | Hobby tracking and learning streaks | ✅ 95% |
| 👨‍👩‍👧‍👦 **Family** | Genealogy tree v2, Profile editing, Auto-sync | ✅ 100% |

### Advanced Features

- 🎤 **Voice Commands**: Speech-to-text task creation (UI ready)
- 🦋 **Butterfly Effect Widget**: Cross-module correlation visualization
- 📅 **Universal Calendar**: Consistent date navigation across all modules
- 🔔 **Real-time Notifications**: Badge system for module updates
- 🎨 **Dark Theme**: Premium glassmorphism design
- 🌐 **i18n Support**: Uzbek, English, Russian

---

## 🛠 Tech Stack

### Frontend (Web Dashboard)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context API
- **UI Components**: Custom components with glassmorphism

### Backend & Infrastructure

- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/products/firestore)
- **Storage**: [Firebase Storage](https://firebase.google.com/products/storage)
- **Hosting**: [Vercel](https://vercel.com/) (recommended) or Firebase Hosting
- **AI**: GROQ API (Llama 3.3, Whisper, Vision) - ✅ Integrated

### Mobile (Planned)

- **Framework**: React Native (Expo)
- **Platform**: iOS & Android
- **Sensors**: HealthKit, Google Fit

---

## 📁 Project Structure

```
AURA/
├── web/                      # Next.js Web Dashboard ✅
│   ├── src/
│   │   ├── app/              # Next.js 14 App Router
│   │   │   ├── dashboard/    # Main dashboard modules
│   │   │   ├── login/        # Authentication
│   │   │   └── register/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Global state (Auth, Language, Notifications)
│   │   ├── services/         # Firestore service layer (10+ services)
│   │   ├── hooks/            # Custom React hooks
│   │   └── firebaseConfig.ts
│   └── public/
│
├── app/                      # React Native Mobile App 🚧
│   └── (Minimal structure created)
│
├── backend/                  # Firebase Cloud Functions 🔴
│   └── (Planned - not started)
│
└── docs/                     # Comprehensive Documentation ✅
    ├── AURA - PRD.md (v2.5)
    ├── Implementation_Status.md
    ├── API_Documentation.md
    ├── Technical_Architecture.md (v2.5)
    ├── Deployment_Guide.md
    └── ... (13 total docs)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or 20+
- **npm** or **pnpm**
- **Firebase account**
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/aura.git
cd aura
```

2. **Install dependencies**

```bash
cd web
npm install
```

3. **Set up Firebase**

- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable Authentication (Email/Password + Google)
- Create Firestore database
- Enable Firebase Storage

4. **Configure environment variables**

Create `web/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deployment

See detailed instructions in [Deployment Guide](docs/Deployment_Guide.md).

**Quick Deploy to Vercel:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/aura)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD v2.1](docs/AURA%20-%20PRD.md) | Product Requirements Document - Master plan |
| [Implementation Status](docs/Implementation_Status.md) | Current development progress (65% complete) |
| [API Documentation](docs/API_Documentation.md) | Complete service layer API reference |
| [Technical Architecture](docs/Technical_Architecture.md) | System design and tech stack |
| [Deployment Guide](docs/Deployment_Guide.md) | Step-by-step production deployment |
| [UI/UX Design](docs/AURA%20-%20UIUX%20Konseptsiya%20va%20Dizayn%20Tizimi.md) | Design system and principles |

---

## 📊 Development Status

### Current State: **v2.0 Stable**

| Platform | Progress | Status |
|----------|----------|--------|
| **Web Dashboard** | 98% | ✅ Production Ready |
| **Backend (Cloud Functions)** | 95% | ✅ AI Core Integrated |
| **Mobile App** | 5% | 🔴 Conceptual Stage |
| **Overall** | **85%** | ✅ Stable Release |

### Roadmap

#### Phase 1: Web Platform Completion (Current) ✅ 90%

- [x] 7 core modules implemented
- [x] Real-time synchronization
- [x] Multi-language support
- [x] Advanced family module
- [ ] Landing page
- [ ] Pricing page

#### Phase 2: Backend & AI (Next 2 months) 🚧

- [ ] Cloud Functions deployment
- [ ] GROQ AI integration
  - [ ] Daily analysis (8 scheduled functions)
  - [ ] Voice command processing
  - [ ] Food image recognition
- [ ] Push notifications
- [ ] Automated archiving

#### Phase 3: Mobile App (3 months) 🔴

- [ ] React Native UI ("The Soul")
- [ ] Sensor integrations (steps, sleep, screen time)
- [ ] Camera features
- [ ] Focus overlay
- [ ] Offline mode

#### Phase 4: Advanced Features (Future) 🎯

- [ ] Social features
- [ ] Marketplace (therapists, coaches)
- [ ] Advanced analytics
- [ ] PDF export
- [ ] Wearable apps (Apple Watch, Wear OS)

---

## 🤝 Contributing

Currently, this is a **private project**. Contributions are by invitation only.

If you'd like to contribute:
1. Contact the project owner
2. Follow code style guidelines (ESLint, Prettier)
3. Write tests for new features
4. Submit detailed pull requests

---

## 📄 License

**Proprietary License**

Copyright © 2024-2026 Siyovush Abdullayev. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use is strictly prohibited.

---

## 👨‍💻 Author

**Siyovush Abdullayev**

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- **Firebase** - Backend infrastructure
- **Vercel** - Hosting platform
- **Next.js Team** - Amazing framework
- **GROQ** - AI capabilities (planned)
- **Tailwind CSS** - Styling system

---

## 📞 Support

For issues or questions:

1. **Documentation**: Check [docs/](docs/) folder first
2. **Issues**: Create an issue on GitHub
3. **Email**: Contact project owner
4. **Discussion**: GitHub Discussions (if enabled)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Firebase**

⭐ Star this repo if you find it helpful!

</div>
