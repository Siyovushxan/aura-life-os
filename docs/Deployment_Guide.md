# AURA - Deployment Guide

**Version:** 1.0  
**Last Updated:** 2026-01-15  
**Platform:** Web Dashboard (Next.js 14)  
**Target:** Production Deployment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Firebase Hosting (Alternative)](#firebase-hosting-alternative)
6. [Domain Configuration](#domain-configuration)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts

- ✅ **Firebase Account** (Google account)
- ✅ **Vercel Account** (recommended) or Firebase Hosting
- ✅ **GitHub Account** (for CI/CD)
- ⚠️ **Custom Domain** (optional but recommended)

### Development Environment

Ensure you have completed local development:

```bash
# Verify Node.js version
node --version  # Should be v18+ or v20+

# Verify dependencies
cd d:/AURA/web
npm install

# Test local build
npm run build
npm start
```

### Required Tools

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version

# Login to Firebase
firebase login
```

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. **Project Name:** `aura-production` (or your choice)
4. **Enable Google Analytics:** Yes (recommended)
5. Click "Create Project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable authentication methods:
   - **Email/Password** ✅ Required
   - **Google** ✅ Required

**Google OAuth Setup:**
```
1. Click on "Google" provider
2. Enable the toggle
3. Set support email (your email)
4. Add authorized domains:
   - localhost (for development)
   - your-domain.com (production)
5. Save
```

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create Database"
3. **Security rules:** Start in **production mode**
4. **Location:** Choose closest to your users (e.g., `us-central1`, `europe-west1`)
5. Click "Enable"

**Deploy Security Rules:**

Create `firestore.rules` in project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Subcollections
      match /family_members/{memberId} {
        allow read, write: if isOwner(userId);
        allow read: if isAuthenticated() && request.auth.uid == memberId;
      }
      
      match /ancestors/{ancestorId} {
        allow read, write: if isOwner(userId);
      }
      
      match /parenting_requests/{requestId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Daily logs
    match /daily_logs/{logId} {
      allow read, write: if isAuthenticated() 
        && resource.data.userId == request.auth.uid;
    }
    
    // Tasks
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read, write: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }
    
    // Focus sessions
    match /focus_sessions/{sessionId} {
      allow read, write: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }
    
    // Family groups
    match /family_groups/{groupId} {
      allow read: if isAuthenticated() 
        && request.auth.uid in resource.data.members;
      allow write: if isAuthenticated()
        && request.auth.uid == resource.data.ownerId;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Step 4: Enable Firebase Storage

1. Go to **Storage**
2. Click "Get Started"
3. **Security rules:** Start in production mode
4. **Location:** Same as Firestore
5. Click "Done"

**Storage Rules:**

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /food_images/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // Max 5MB
        && request.resource.contentType.matches('image/.*');
    }
    
    match /avatars/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        && request.resource.size < 2 * 1024 * 1024  // Max 2MB
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Deploy:
```bash
firebase deploy --only storage:rules
```

### Step 5: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (</>) to add web app
4. **App nickname:** `AURA Web Dashboard`
5. **Enable Firebase Hosting:** No (we'll use Vercel)
6. Click "Register app"
7. **Copy the config object** - you'll need this for env variables

Example config:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "aura-production.firebaseapp.com",
  projectId: "aura-production",
  storageBucket: "aura-production.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}
```

---

## Environment Configuration

### Step 1: Create Environment Files

In your web project (`d:/AURA/web/`), create:

**`.env.local`** (for local development):
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aura-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aura-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**`.env.production`** (for production build):
```bash
# Same as .env.local but can have different values
# if using separate Firebase projects for dev/prod
```

### Step 2: Update .gitignore

Ensure `.env.local` and `.env.production` are in `.gitignore`:

```
# Environment variables
.env*.local
.env.production
.env.development
```

### Step 3: Verify Firebase Config

Check `web/src/firebaseConfig.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Vercel Deployment

### Step 1: Connect to GitHub

1. Push your code to GitHub:

```bash
cd d:/AURA
git init
git add .
git commit -m "Initial commit - AURA v1.0"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/aura.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Framework Preset:** Next.js (auto-detected)
5. **Root Directory:** `web`
6. Click "Deploy"

> ⚠️ First deployment will fail - we need to add environment variables

### Step 3: Configure Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY          = AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      = aura-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID       = aura-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   = aura-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 123456789012
NEXT_PUBLIC_FIREBASE_APP_ID           = 1:123456789012:web:abc...
```

**Environment scope:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (optional)

3. Click "Save"

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Find the failed deployment
3. Click "..." → "Redeploy"

Or push a new commit:
```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push
```

### Step 5: Verify Deployment

1. Wait for deployment to complete (~2-3 minutes)
2. Click on the deployment URL (e.g., `aura-xyz.vercel.app`)
3. Test:
   - ✅ Homepage loads
   - ✅ Login works
   - ✅ Registration works
   - ✅ Dashboard accessible
   - ✅ All modules functional

---

## Firebase Hosting (Alternative)

If you prefer Firebase Hosting over Vercel:

### Step 1: Initialize Firebase Hosting

```bash
cd d:/AURA/web
firebase init hosting
```

Configuration:
- **Public directory:** `out` (Next.js static export)
- **Configure as SPA:** Yes
- **Overwrite index.html:** No
- **Set up automatic builds:** No

### Step 2: Update Next.js Config

Edit `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true,  // Required for static export
  },
}

module.exports = nextConfig
```

### Step 3: Build and Deploy

```bash
# Build static export
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

> ⚠️ **Note:** Static export has limitations:
> - No Server-Side Rendering (SSR)
> - No API routes
> - No dynamic routing with getServerSideProps

**Recommendation:** Use Vercel for full Next.js features.

---

## Domain Configuration

### Option 1: Vercel Custom Domain

1. Go to Vercel project **Settings** → **Domains**
2. Click "Add"
3. Enter your domain: `app.aura.com` (or whatever you own)
4. Follow DNS configuration instructions:

**For Cloudflare/Namecheap/GoDaddy:**
```
Type: A
Name: app
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (5-60 minutes)
6. Vercel will auto-provision SSL certificate

### Option 2: Firebase Custom Domain

1. Go to Firebase **Hosting**
2. Click "Add custom domain"
3. Enter domain and follow instructions

---

## Monitoring & Analytics

### Google Analytics

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (e.g., `G-XXXXXXXXXX`)
3. Add to environment variables:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. Create `web/src/lib/gtag.ts`:

```typescript
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

5. Add to `web/src/app/layout.tsx`:

```tsx
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Vercel Analytics

Vercel provides built-in analytics:

1. Go to Vercel project → **Analytics** tab
2. Enable "Web Analytics"
3. Install package:
   ```bash
   npm install @vercel/analytics
   ```
4. Add to layout:
   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

### Error Tracking (Sentry)

Optional but highly recommended:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow Sentry wizard instructions.

---

## Post-Deployment Checklist

### Functionality Testing

- [ ] **Authentication:**
  - [ ] Email/password registration
  - [ ] Email/password login
  - [ ] Google OAuth login
  - [ ] Logout
  - [ ] Password reset

- [ ] **Dashboard:**
  - [ ] All 7 modules load
  - [ ] Data saves to Firestore
  - [ ] Real-time updates work
  - [ ] Language switching works

- [ ] **Family Module:**
  - [ ] Create family group
  - [ ] Join family group
  - [ ] Real-time member updates
  - [ ] Genealogy tree renders

- [ ] **File Uploads:**
  - [ ] Food images upload to Storage
  - [ ] Images display correctly

### Performance Testing

```bash
# Run Lighthouse audit
# Chrome DevTools → Lighthouse → Generate Report

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
```

### Security Testing

- [ ] Firebase security rules enforced
- [ ] No sensitive data in console
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Environment variables not exposed

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Troubleshooting

### Common Issues

#### 1. "Firebase: Error (auth/configuration-not-found)"

**Solution:** Check environment variables are set correctly in Vercel.

#### 2. "Firestore Permission Denied"

**Solution:** Verify security rules allow authenticated access.

```bash
firebase deploy --only firestore:rules
```

#### 3. Build Fails on Vercel

**Check build logs:**
1. Go to Vercel deployment
2. Click "View Function Logs"
3. Look for errors

**Common causes:**
- Missing environment variables
- TypeScript errors
- Import errors

#### 4. Images Not Loading

**If using next/image:**
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}
```

#### 5. Real-time Updates Not Working

**Check:**
- Firestore rules allow read access
- WebSocket connections not blocked
- No ad blockers interfering

---

## Rollback Procedures

### Vercel Rollback

1. Go to **Deployments** tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Firebase Rules Rollback

```bash
# View rule history
firebase firestore:rules list

# Rollback to specific version
firebase firestore:rules release [RELEASE_NAME]
```

### Code Rollback

```bash
# Revert last commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

---

## Continuous Deployment

### Automatic Deployments

Vercel auto-deploys on:
- ✅ Push to `main` branch → Production
- ✅ Push to other branches → Preview deployments
- ✅ Pull requests → Preview deployments

### Branch Protection

Set up on GitHub:

1. Go to repository **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks (Vercel build)
   - ✅ Require branches to be up to date

---

## Environment Promotion

### Development → Staging → Production

```bash
# .env.development
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-dev

# .env.staging
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-staging

# .env.production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-production
```

In Vercel, create separate projects for each environment.

---

## Backup Strategy

### Firestore Backups

Enable automatic backups:

1. Go to Firebase Console → **Firestore**
2. Enable **Automated Backups** (requires Blaze plan)

Or manual export:

```bash
gcloud firestore export gs://aura-backups/$(date +%Y%m%d)
```

### Code Backups

GitHub is your source of truth. Additionally:

```bash
# Tag releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## Support Contacts

**Firebase Support:** [firebase.google.com/support](https://firebase.google.com/support)  
**Vercel Support:** [vercel.com/support](https://vercel.com/support)  
**Documentation:** [AURA docs/](file:///d:/AURA/docs/)

---

## Changelog

### v1.0 (2026-01-15)
- Initial deployment guide
- Firebase setup instructions
- Vercel deployment process
- Security rules and monitoring

---

*Deployment qilingach production URL ni saqlab qo'ying va team a'zolariga ulashing!* 🚀
