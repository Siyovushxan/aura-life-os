# AURA - Web Design System (Landing & Dashboard)

**Status:** Production Ready
**Version:** 1.0 (Web Completed)
**Last Updated:** 2026-01-27

---

## 1. Design Philosophy: "Dual Reality" (Web Edition)

The Web platform of AURA represents **"The Brain"** (Rationality, Strategy, Deep Analysis). Unlike the mobile app ("The Soul"), which focuses on emotion and quick actions, the Web experience is designed for **total control** and **strategic oversight**.

### Core Visual Pillars

* **Deep Dark Mode:** Pure black backgrounds (`#000000`) with subtle glassmorphism.
* **Neon Accents:** Functional color coding (Cyan = AI, Gold = Finance, Green = Health).
* **Glassmorphism:** High-end blur effects (`backdrop-filter: blur(20px)`) to create depth.
* **Motion:** Smooth, physics-based transitions (Scroll-snap on Landing, Drag & Drop on Dashboard).

---

## 2. LANDING PAGE DESIGN (Scrollytelling Experience)

The Landing Page is not just an informational site but an interactive story told through scrolling. It consists of **7 Full-Screen Sections** using **CSS Scroll Snap**.

### Architecture

#### **Header (Floating Glass)**

* **Position:** Sticky Top.
* **Style:** Fully transparent background with blur only on scroll.
* **Logomark:** "AURA" text + Minimalist Sphere icon (No box/container).
* **Actions:** "Login" (Text Link) vs "Get Started" (Neon Border Button).

#### **Section 1: The Hero (The Question)**

* **Visual:** A giant, 3D interactive **Aura Sphere** floating in the center. It tracks mouse movement (Parallax).
* **Typography:** Huge, centered H1: *"Are you living your life, or just watching it?"*
* **Interaction:** User must scroll to "break" the sphere and enter the system.

#### **Section 2: The Glitch (The Problem)**

* **Effect:** As the user scrolls, the pristine Sphere glitches (chromatic aberration).
* **Content:** Chaos words appear randomly: *"Stress"*, *"Debt"*, *"Burnout"*.
* **Goal:** To visually represent the user's current disorganized state.

#### **Section 3: The Solution (The Clarity)**

* **Transition:** The glitch resolves into a clean, organized grid.
* **Cards:** Three glass panels float up:
    1. **Secure:** Lock icon (Encryption).
    2. **Smart:** Brain icon (AI Analysis).
    3. **Unified:** Circle icon (All-in-One).

#### **Section 4: The Butterfly Effect (The Logic)**

* **Visual:** An interactive line graph.
* **Interaction:** A slider allows the user to reduce "Sleep".
* **Reaction:** As "Sleep" goes down, "Finances" goes down (Spending increases) and "Stress" goes up.
* **Message:** "Small changes, massive impact."

#### **Section 5: Dual Reality (Web vs Mobile)**

* **Layout:** Split Screen Slider.
* **Behavior:** Dragging a central handle reveals either the Mobile App ("The Soul" - Emotional) or the Web Dashboard ("The Brain" - Analytical).

#### **Section 6: Legacy (Family)**

* **Visual:** A glowing, neon **Genealogy Tree** background.
* **Content:** Highlights "Smart Parenting" and "Heritage" features.

#### **Section 7: Call to Action**

* **Centerpiece:** A pulsing "Start 7-Day Free Trial" button.
* **Social Proof:** 3 minimal testimonials.

---

## 3. WEB DASHBOARD DESIGN ("God Mode")

The Dashboard is the command center. It uses a **Bento Grid** layout, popularized by Apple and Linear, to show maximum information in a beautiful, organized way.

### 3.1 Layout & Grid System (Bento Box)

* **Structure:** A dynamic, responsive grid where widgets can span 1x1, 2x1, or 2x2 blocks.
* **Drag & Drop:** Users can rearrange modules (Health, Finance, Focus) to suit their priority.
* **Styling:**
  * **Background:** `#111` (slightly lighter than pure black).
  * **Cards:** `rgba(255, 255, 255, 0.05)` background with `1px` border `rgba(255, 255, 255, 0.1)`.
  * **Shadows:** Colored glows based on the module type (e.g., Gold glow for Finance card).

### 3.2 Key Modules

#### **Finance Widget (Wealth)**

* **View:** "Butterfly Effect" Chart.
* **Data:** Shows correlation between spending and mood.
* **Color:** Gold (`#FFD600`).

#### **Focus Widget (Productivity)**

* **View:** Deep Work Timer.
* **Interaction:** Clicking "Start" dims the entire dashboard (Lights Out Mode), leaving only the timer visible.
* **Color:** Purple (`#7000FF`).

#### **Health Widget (Vitality)**

* **View:** Bio-Battery Level.
* **Visual:** A fluid liquid fill indicating energy level (Green -> Red).
* **Color:** Neon Green (`#00FF94`).

#### **Family Widget (Heritage)**

* **View:** Mini Family Tree or Activity Feed.
* **Content:** "Son finished math homework" (Real-time alert).
* **Color:** Cyan (`#00F0FF`).

### 3.3 The Command Palette (Cmd+K)

* **Access:** Global hotkey `Cmd+K` (or `Ctrl+K`).
* **Design:** A centered, floating search bar with a blurry backdrop.
* **Functionality:** Natural Language Processing.
  * *Input:* "Logged $50 for Groceries" -> *Action:* Adds transaction.
  * *Input:* "Start Focus Mode" -> *Action:* Triggers timer.

### 3.4 Infinite Canvas (Mind Map)

* **Feature:** For the "Interests" and "Family" modules, the dashboard breaks the grid and opens an **Infinite Canvas**.
* **Interaction:** Pan and Zoom (like Figma/Miro) to explore complex family trees or knowledge graphs.

---

## 4. Typography & Iconography

### Fonts

* **Headings:** `Space Grotesk` (Bold, Uppercase, Tracking +1px). Used for module titles and landing page headers.
* **Body:** `Inter` (Regular, legible). Used for data tables, texts, and inputs.

### Icons

* **Set:** Custom SVG set or `Lucide React` (Stroke width 1.5px).
* **Style:** Minimalist, thin lines. No solid fills unless active.

---

## 5. Animations & Micro-interactions

* **Hover:** Cards slightly lift (`transform: translateY(-5px)`) and border glow intensifies.
* **Click:** Immediate active state (`scale: 0.98`) for tactile feel.
* **Load:** Staggered fade-up animation for grid items (`opacity: 0 -> 1`, `translateY: 20px -> 0`).
* **Transitions:** All route changes use a "Fade Through" transition (current page fades out, new page fades in).

---

**Summary:** The AURA Web Design is built to make the user feel powerful ("God Mode"). It hides complexity behind a beautiful, unified grid but allows deep diving into data when needed.
