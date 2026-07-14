# 🖥️ Dynamic Display System (DDS) — Enterprise AI Platform

> **منصة ذكية لإدارة وعرض البيانات الديناميكية**
>
> DDS is an ultra-premium, highly customizable, and intelligent Dynamic Display System. It decouples static business interfaces and branding, transforming them into a reactive, data-driven ecosystem. Suitable for **Clinics, Hotels, Academies, E-Commerce, Retail, Digital Signage, Cafés, and Corporate Exhibits**, DDS empowers businesses to build and display localized interactive catalogs and directories synced with a central, automated AI command workspace.

---

## 🚀 Key Modules & Visual Workspaces

The platform is architected into two core, state-of-the-art sections:

### 1. 🌐 The Enterprise Marketing Landing Page (`/`)
An elegant, cinematic dark-themed portal with interactive features:
* **Interactive Live Sector Simulator**: Clicking on sector chips (Medical, Luxury, Education, Retail, Digital, Cafe, Custom) instantly morphs the mock device interfaces, color schemes, and descriptive schemas to display sector-specific data.
* **Cinematic Backdrop Grids**: Built on a modern CSS neon mesh canvas with smooth scroll animations.
* **FAQ Accordions & Pricing Tiers**: Full localized English/Arabic matrices detailing licensing tiers and capabilities.

### 2. 📱 The Cozy Android-Style Customer Display App (`/menu`)
Your public customer-facing catalog wrapped inside an ultra-realistic Android mobile frame:
* **Mobile-First Shell Design**: Complete with a simulated notch, top status bar showing a live synchronized clock, network signals, battery charge status, and a native bottom swipe indicator bar.
* **Cozy Interactive Grid Cards**: Display dynamic products, medical profiles, suites, or courses.
* **Synonym Search Normalization**: Uses an intelligent search query system supporting synonyms (e.g. matching "doctor" to "طبيب") and removing Arabic harakat for zero dead-ends.
* **Smooth Navigation Docks**: Cozy bottom buttons for Home, Explore, Favorites, and dynamic catalog paging with smooth scroll-to-top on page transitions.

### 3. 🧠 The Maestro AI Swarm Admin command center (`/admin` → Tab: AI)
An industry-first, cognitive orchestration workspace that coordinates multi-agent workflows 24/7:
* **The Maestro Core General Agent**: Acts as the brain router, parsing client commands and dispatching sub-tasks to specialized sub-agents.
* **5 Specialized Cognitive Sub-Agents**:
  1. **DevOps & MCP Engineer Agent**: Configures ports, test probes, and builds local Model Context Protocol scripts.
  2. **BI Analyst Agent**: Audits customer retention logs, calculates LTV ratios, and converts analytics to spreadsheets.
  3. **Document & PDF Creator Agent**: Compiles Markdown blueprints, guides, and manuals.
  4. **Cron & Standup Tasker Agent**: Orchestrates task schedules, reminders, and standup channels.
  5. **Campaign & Social Ad Buyer Agent**: Monitors Meta Graph and Google Analytics ROI to suggest budget adjustments.
* **100+ Agent Tools & 30+ Skills System (`SKILLS.md`)**:
  - Contains a searchable tools matrix inside the admin dashboard with individual authorize/mute toggle switches (e.g. `tool_os_shell_exec`, `tool_browser_navigation`, `tool_csv_writer_service`, `tool_whatsapp_msg_sender`).
  - Active 30+ skill indicators loaded from `SKILLS.md`.
* **35+ Consolidated Integration Connectors**:
  - Interactive grid to connect, manage, and test communication protocols across different stacks:
    - **Socials & CRM**: WhatsApp Cloud, Instagram Business, Facebook Messenger, Meta Lead-Ads, X (Twitter) Developer API.
    - **Cloud & Databases**: Cloudflare Pages, Firebase RTDB, Supabase, R3 Distributed DB, Ollama, LM Studio.
    - **Productivity**: Gmail IMAP, Google Workspace Admin, Slack, Notion Workspace, Smart Interactive Whiteboards.
* **24/7 Automation Scheduler Console**:
  - Admins can construct, toggle, and purge recurring cron automation triggers.
  - Linked to a live-executing virtual terminal log printing background task dispatches in real-time.
* **Interactive Slide Deck & Presentation Creator**:
  - Compiles live data inputs into a beautifully stylized 16:10 presentation deck simulator with custom neon accent frames.
  - Features custom slide-transition steps and one-click PDF printing utilities.

---

## 🔒 Enterprise Security & Licensing

* **Cryptographic Activation Core (`/onboarding` Step 1)**:
  - Access to all functional application paths is strictly gated until the core is activated.
  - Raw lifetime keys are fully secured against reverse engineering or client bundle analysis by compiling only their **Unsigned 32-bit DJB2 Cryptographic Hashes** in the frontend code.
  - Real-time verification ensures keys are marked on Firebase RTDB to enforce strict single-use validation, preventing multi-instance bypasses.

* **Advanced 5-Step Onboarding Wizard (`/onboarding`)**:
  1. **License Activation**: Secure hash key check.
  2. **Sector Selection**: Choose from Clinic, Hotel, Academy, E-Commerce, Signage, Cafe, or Custom.
  3. **Branding Visuals**: Instantly swap between 6 premium, HSL CSS visual identity palettes (Teal, Navy, Bronze, Purple, Emerald, Cafe).
  4. **AI Persona Config**: Set the AI Persona Name, custom greetings, avatar links, and social hooks.
  5. **Seed Template Catalog**: Push rich initial template databases directly to Firebase RTDB on click.

---

## 🛠 Tech Stack & Specifications

* **Typography**: Elegant **IBM Plex Sans** (for English) and **IBM Plex Sans Arabic** (for Arabic) declared globally to ensure superb clarity and readability.
* **Client App Core**: React (Vite) + Tailwind CSS + Lucide Icons + SweetAlert2.
* **Ecosystem Engine**: Multi-Model LLM Layer:
  - **Active AI Providers**: Groq, OpenAI Compatible, Local Ollama, LM Studio, or Pollinations Free.
  - **Graceful Failover Layer**: Features a robust, redundant Try/Catch network wrapper that seamlessly redirects offline or throttled API calls to Pollinations.ai reasoning fallback models (`gpt-oss-20b`).
* **Automated CI/CD Deployment**:
  - **Configuration (`deploy.yml`)**: Compiles and deploys production bundles automatically to GitHub Pages on pushes to the `main` branch.
  - **SPA Support**: Automatically copies compiled `index.html` to `404.html` to preserve client-side React router transitions.

---

## 📂 Project Organization

```bash
├── artifacts/azura/src/
│   ├── App.tsx                    # React Router paths & Global initialization
│   ├── index.css                  # Global HSL CSS variables & IBM Plex imports
│   ├── components/
│   │   ├── AIAdminAssistant.tsx   # 3-Column Maestro AI Swarm command center
│   │   └── Layout.tsx             # Universal Layout and dynamic styling hooks
│   ├── lib/
│   │   ├── crypto.ts              # Multi-Provider, Local, and Fallback LLM layer
│   │   ├── firebase.ts            # Firebase Realtime Database connections
│   │   └── activation.ts          # Secure DJB2 hash licensing validators
│   └── pages/
│       ├── Landing.tsx            # Cinematic Enterprise Landing Page
│       ├── OnboardingWizard.tsx   # 5-Step business setup wizard
│       ├── Admin.tsx              # Central Admin command tabbed panel
│       └── MenuLightweight.tsx    # Android Mobile Customer Display app
```

---

## 🚀 Getting Started

To run the platform locally or prepare for production deployment:

```bash
# Navigate to workspace
cd artifacts/azura

# Install hoisted dependencies
pnpm install

# Build production compiled bundle
pnpm run build

# Verify TypeScript types
pnpm run typecheck

# Start local server preview
pnpm run serve
```

*Dynamic Display System — Turning Static Data Into Intelligent Experiences.*
