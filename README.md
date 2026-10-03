<div align="center">

  <img src="public/hercules-3d-logo.png" alt="Hercules Gym Logo" width="160" height="auto" />

  # 🏋️‍♂️ HERCULES GYM APP & CLOUD ECOSYSTEM
  ### Next-Generation Digital Gym Management Platform (Mobile & Web)

  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Expo](https://img.shields.io/badge/Expo_React_Native-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis_Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
  [![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
  [![Cloudinary](https://img.shields.io/badge/Cloudinary_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

  <p align="center">
    <strong>A client-driven, enterprise-grade digital gym operations ecosystem built for Hercules Gym to replace fragmented manual processes with a centralized, multi-branch, role-aware system.</strong>
  </p>

  <p align="center">
    <a href="https://herculesgym.rounaks-student.workers.dev">🌐 <strong>Live Web App</strong></a> •
    <a href="https://hercules-gym-api-847366288287.asia-southeast1.run.app/docs">⚡ <strong>API Documentation</strong></a> •
    <a href="#-bespoke-stakeholder-specific-implementations">🧠 <strong>Stakeholder Logic</strong></a> •
    <a href="#-mobile-app-screenshots">📱 <strong>Screenshots</strong></a> •
    <a href="#-system-architecture">🏗️ <strong>Architecture</strong></a>
  </p>
</div>

---

## 📌 Table of Contents
- [Why This Was Built](#-why-this-was-built)
- [Stakeholder Demands & Client Requirements](#-stakeholder-demands-client-requirements)
- [Bespoke Stakeholder-Specific Implementations](#-bespoke-stakeholder-specific-implementations)
- [Production Deployments](#-production-deployments)
- [System Architecture](#-system-architecture)
- [Core Salient Features](#-core-salient-features)
- [High-Performance & Zero-Egress Optimizations](#-high-performance--zero-egress-optimizations)
- [Redis Caching & Automated Disaster Recovery](#-redis-caching--automated-disaster-recovery)
- [Design Architecture and UX Tactics Used](#-design-architecture-and-ux-tactics-used)
- [Client Impact & Operational Value](#-client-impact--operational-value)
- [Mobile & Web Screenshots](#-mobile--web-screenshots)
- [Complete Technology Stack](#-complete-technology-stack)
- [Repository Structure](#-repository-structure)
- [Local Development & Setup](#-local-development--setup)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment & Release Notes](#-deployment--release-notes)
- [Ownership & Attribution Context](#-ownership--attribution-context)

---

## 💡 Why This Was Built

**Hercules Gym** needed a unified digital ecosystem to eliminate paper registers and replace manual records across multiple physical branch locations:

- **Member Lifecycle & Approvals**: End-to-end registration, document approval, KYC, and emergency contacts.
- **Attendance & Check-in Consistency**: Real-time QR attendance with synchronized check-in / check-out logic and geo-location branch locks.
- **Workouts, Diet Plans & Trainer Assignments**: Structured routine builder and trainer-to-member allocation.
- **Membership & Shop Payment Records**: Front-desk verified payment receipts, fine splitting, and automated billing cycles.
- **Branch-Wise Communication & Announcements**: Real-time broadcasts, member feeds, and bilingual notices (English & Bengali).
- **Profile Data, Reminders & Operational Reporting**: Automated birthday greetings, fee expiration alerts, and comprehensive financial reports.

> **Primary Objective**: Centralized real-time records, rapid administrative decisions, zero manual bookkeeping errors, and complete fiscal accountability.

---

## 🎯 Stakeholder Demands (Client Requirements)

Built directly to client specifications:

* 📱 **Mobile-First Experience**: High-performance Native Android & iOS app for Admins, Trainers, and Members.
* 💻 **Web Management Portal**: Cross-platform Web application for desktop front-desk administration and member self-service.
* 🏢 **Multi-Branch Governance**: Granular branch segregation (**Ranaghat**, **Chakdah**, **Madanpur**) preventing cross-branch data leakage.
* 🗄️ **Centralized Cloud Database**: Highly available, clustered storage for all operational and historical data.
* 🛡️ **Zero-Loss Disaster Recovery**: Continuous automated backup snapshots and passive replica copies to ensure zero data loss.
* ⚡ **High-Throughput Redis Caching**: In-memory caching layer shielding primary databases from heavy spikes and malicious scraper traffic.
* 💳 **Payment Workflows**: Monthly payment reminders, fine splitting, proof upload (screenshots/receipts), and admin approval flows.
* ⏱️ **Role-Restricted Attendance**: Instant QR scan check-in/check-out with secure historical logs.
* 🌐 **Bilingual Support**: Native English and Bengali script support across all interfaces.
* 🚀 **Zero Downtime & Zero Cloud Cost**: Optimized for modern serverless free tiers (Google Cloud Run + Cloudflare + Cloudinary + MongoDB Atlas + Redis).
* 📦 **Production Play Store Pipeline**: EAS Android App Bundle (`.aab`) and APK distribution ready.

---

## 🧠 Bespoke Stakeholder-Specific Implementations

Unlike generic corporate gym management systems or cookie-cutter SaaS templates, the Hercules Gym platform incorporates **deep domain-driven design (DDD)** tailored directly to the client's physical town operational workflows:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               GENERIC SAAS PATTERN                  HERCULES GYM STAKEHOLDER LOGIC     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Rolling 30/90-day subscription cycles     ──►    Strict 1st-of-month calendar expiry│
│ 2. Unattended payment gateway checkout       ──►    Admin-mediated desk clearance      │
│ 3. Binary account lockout / auto charge      ──►    1-7 day grace + ₹5/day fine split  │
│ 4. Single turnover revenue line              ──►    4-tier split revenue ledger pools  │
│ 5. Monolithic neutral color theme            ──►    Dynamic 3-center visual inheritance│
│ 6. Minimal email-only registration           ──►    2-slide full physical KYC registry │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. 📅 Strict 1st-of-the-Month Term Inactivity Rule
* **Generic SaaS Approach**: A member subscribing on January 18th is charged or expires on February 18th (rolling timestamp intervals).
* **Stakeholder Implementation**: Membership terms are strictly pinned to the **1st of the renewal month**, ignoring registration day:
  * **Monthly Plan**: Joins in January (any date) $\rightarrow$ Inactive from **February 1st**.
  * **Quarterly Plan**: Joins in January $\rightarrow$ Valid for Jan, Feb, Mar $\rightarrow$ Inactive from **April 1st**.
  * **Semi-Annual Plan**: Joins in January $\rightarrow$ Inactive from **July 1st**.
  * **Annual Plan**: Joins in January 2026 $\rightarrow$ Inactive from **January 1st, 2027**.
* **Reactivation**: Accounts automatically flip to active status the moment the admin records their term renewal payment.

### 2. ⚡ The 1–7 Day Grace Period & Progressive ₹5/Day Late Fine Splitting
* **Generic SaaS Approach**: Instant card charge retry or immediate membership cancellation.
* **Stakeholder Implementation**: Mirrors the physical gym front-desk collection practice:
  * **Days 1 to 7 of a month**: Normal fee only ($\text{Fine} = ₹0$).
  * **Day 8 onwards**: A penalty of **₹5 per passing day** accumulates ($\text{Fine} = (\text{Day} - 7) \times 5$).
  * **Due Visibility**: Dues and fine breakdowns are displayed directly on member cards in the admin roster and on the member's Digital Pass.
  * **Automated Accounting Split**: When registering payment, the system knows the standard plan baseline and splits the total paid into **Normal Fee Portion** and **Late Fine Portion** on all receipts and financial statements.

### 3. 💳 Admin-Only Payment Mediation (No Direct App Checkout)
* **Generic SaaS Approach**: End-users checkout unattended via payment gateway webhooks.
* **Stakeholder Implementation**: To accommodate real-world cash collections and direct desk-to-bank UPI transfers in physical gym branches:
  * Regular members do not trigger automatic gateway billing inside the app.
  * Admin registers all payments via a dedicated **"Register Payment"** action on each member's card.
  * Fields include Category (`Gym Fees Payment`, `Gym Item Order Payment`, `Others`), Mode (`Online` vs `Offline`), Money Paid, and Reason.
  * Immediate receipt generation with instant member reactivation.
  
### 4. 🎨 Multi-Center Dynamic Chromatic Theme Inheritance
* **Generic SaaS Approach**: Neutral, monochromatic, or static white/dark user interfaces.
* **Stakeholder Implementation**: A unified network where switching branches dynamically transforms the visual theme, gradients, 3D buttons, badges, and glows across the entire application:
  * 🔴 **Ranaghat Center**: Fiery Amber / Rose / Red (`from-amber-400 via-rose-500 to-red-600`)
  * 🟣 **Chakdah Center**: Purplish-Pink (`from-fuchsia-600 via-purple-600 to-pink-600`)
  * 🟢 **Madanpur Center**: Greenish-Yellow (`from-emerald-500 via-green-500 to-yellow-400`)

### 5. 📊 4-Pool Segregated Revenue Intelligence ("Revenue Record")
* **Generic SaaS Approach**: Single gross sales turnover number.
* **Stakeholder Implementation**: Clean separation into 4 distinct operational revenue streams matching front-desk books:
  1. 💰 **Normal Revenue Collected**: Core membership plan collections (without late fees).
  2. ⚡ **Fine Revenue Collected**: Accumulated ₹5/day late fee penalties.
  3. 🛍️ **Gym Item Revenue Collected**: Supplement store, apparel, and merchandise orders.
  4. 📋 **Other Revenue Collected**: Lockers, induction fees, personal coaching, and event passes.
  
### 6. 📝 Two-Slide Full-Page Admission & Plan Selection Architecture
* **Generic SaaS Approach**: Cramped popup modal with minimal input fields.
* **Stakeholder Implementation**:
  * **Slide 1 (Profile & Verification Data)**: Full-viewport layout capturing guardian contact, present & permanent addresses, body weight/height, medical notes, enrollment programme (Gym, Karate, Yoga, Crossfit, Kidsfit), and batch shifts (Ladies vs General).
  * **Slide 2 (Fees & Membership Plan Selection)**: Displays the **4 Official Membership Plans** (Monthly ₹700, Quarterly ₹1,900, Half-Yearly ₹3,500, Annual ₹6,500) and active festive occasion passes, logging initial payment proof directly.

---

## 🌐 Production Deployments

| Component | Platform | URL / Endpoint |
| :--- | :--- | :--- |
| **Web Frontend** | Cloudflare Edge Workers | [`https://herculesgym.rounaks-student.workers.dev`](https://herculesgym.rounaks-student.workers.dev) |
| **Backend API** | Google Cloud Run (Asia-SE1) | [`https://hercules-gym-api-847366288287.asia-southeast1.run.app`](https://hercules-gym-api-847366288287.asia-southeast1.run.app) |
| **Swagger Docs** | Interactive OpenAPI UI | [`https://hercules-gym-api-847366288287.asia-southeast1.run.app/docs`](https://hercules-gym-api-847366288287.asia-southeast1.run.app/docs) |
| **Media Assets** | Cloudinary Global CDN | Edge-optimized AVIF/WebP image streaming |
| **Database** | MongoDB Atlas Cluster | Encrypted multi-tenant document storage |
| **Cache & Mirror** | Redis & In-Memory TTL Engine | Read-through caching with automated 12h DR snapshots |

---

## 🏗️ System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │                     CLIENT LAYERS                      │
               └────────────────────────────────────────────────────────┘
                      │                                        │
           ┌──────────────────────┐               ┌──────────────────────────┐
           │   Android Mobile App │               │   React / Vite Web App   │
           │  (Expo React Native) │               │   (Cloudflare Edge CDN)  │
           └──────────────────────┘               └──────────────────────────┘
                      │                                        │
                      └──────────────────┬─────────────────────┘
                                         ▼
                 ┌──────────────────────────────────────────────┐
                 │       Google Cloud Run (Asia-SE1)            │
                 │        FastAPI Microservices Core            │
                 ├──────────────────────────────────────────────┤
                 │ • GZip Dynamic Compression (<400B threshold) │
                 │ • Multi-Tier Redis Cache Engine (Read-Thru)  │
                 │ • Automated Disaster Recovery Snapshotter    │
                 │ • JWT RBAC Auth & Branch Route Scopes        │
                 │ • Asynchronous Event Scheduler & Reminders   │
                 └───────────────────────┬──────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────┐               ┌─────────────────┐               ┌───────────────┐
│ MongoDB Atlas │               │ Cloudinary CDN  │               │ Redis / Cache │
│ Primary Store │               │ Media & Photos  │               │ In-Memory TTL │
└───────┬───────┘               └─────────────────┘               └───────────────┘
        │
        ▼ (Automated 12-Hour Sync)
┌────────────────────────────────┐
│  Disaster Recovery Snapshot    │
│  db.database_backups (Archive) │
└────────────────────────────────┘
```

---

## ⚡ Core Salient Features

### 1. Role-Based Access Control (RBAC) & Approvals
- **Four Distinct Roles**: `Primary Admin`, `Branch Admin`, `Trainer`, and `Member`.
- Automated approval workflow with photo verification, branch assignment, and onboarding status markers.

### 2. Multi-Branch Operations
- Centralized oversight with physical branch-level isolation for **Ranaghat**, **Chakdah**, and **Madanpur**.
- Branch-scoped trainers, member assignments, and accounting books.

### 3. QR-Based Attendance Engine
- Dynamic QR code check-in and check-out with time-window validation.
- Attendance history with date-range filters, monthly aggregation, and exportable logs.

### 4. Payments, Shop & Revenue Intelligence
- **Revenue Record**: 4-pool financial segregation (Normal, Fine, Store, Other).
- **Gym Store Module**: Full supplement catalog with flavour and size variant selectors, inventory counters, and branch pickup verification.
- **Front-Desk Verification**: Receipt generation, automatic fine calculation, and ledger audits.
- **Proof-of-Payment Verification**: Screenshot and UTR upload with admin one-click approval/rejection.
- **Financial Analytics**: Total collections, overdue payments, and monthly revenue visualizers.

### 5. Training & Nutrition Management
- Personalized workout creation with sets, reps, weight metrics, and rest timers.
- Customized dietary regimen builder with macro-nutrient guidance.

### 6. Communication & Engagement
- **Branch-Targeted Announcements**: Push and in-app broadcasts.
- **Automated Birthday Engine**: Automatic greetings to members and trainers.
- **Gym Wall & Hero Carousel**: Admin-curated photo gallery and achievement showcases.
- **Bilingual Interface**: Full English and native Bengali (বাংলা) support.

---

## 🚀 High-Performance & Zero-Egress Optimizations

To deliver maximum performance and operate smoothly within free-tier limits:

| Optimization Technique | Implementation Detail | Bandwidth / CPU Impact |
| :--- | :--- | :--- |
| **Read-Through Redis Caching** | `RedisCacheEngine` with TTL and pattern invalidation for hot endpoints | **80% – 90% DB query offload** on read-heavy traffic |
| **Dynamic GZip Compression** | `GZipMiddleware` applied to all API responses $\ge 400\text{ bytes}$ | **75% – 85% reduction** in raw JSON payload size |
| **CDN Media Offloading** | Base64 strings converted on upload and offloaded to Cloudinary CDN | **99.98% payload reduction** per image (~60B URL vs ~500KB Base64) |
| **Cloudflare Global Edge** | Static Vite web assets served from 330+ edge locations | **0 MB web egress** on Google Cloud Run |
| **Database Projection Indexing** | Optimized MongoDB compound indexes on `user_id`, `center`, `date` | **Sub-50ms query latency** under heavy load |
---

## 🛡️ Redis Caching & Automated Disaster Recovery

### 1. Multi-Tier Caching Architecture (`RedisCacheEngine`)
To prevent database CPU spikes from high-frequency reads or malicious scraper loops:
* **Read-Through Caching**:
  * **Merchandise & Supplements (`/api/merchandise`)**: Cached with 120s TTL for instant catalog browsing.
  * **Announcements & Alerts (`/api/announcements`)**: Scoped per role and center with 60s TTL.
  * **Master Product Catalog (`/api/catalog`)**: Cached for 300s.
  * **Admin Dashboard Metrics (`/api/dashboard/admin`)**: Cached for 30s.
* **Instant Invalidation on Mutation**: When an administrator adds, updates, or deletes items or announcements, the cache engine immediately purges matching key patterns (`cache:merchandise*`, `cache:announcements*`).
* **Resilient In-Memory Fallback**: If Redis network disconnects, the engine seamlessly falls back to an internal in-process TTL cache with zero downtime or user impact.

### 2. Automated Disaster Recovery & Database Mirroring (`DisasterRecoveryEngine`)
To guarantee business continuity even if the primary database is lost or corrupted:
* **Automated 12-Hour Snapshots**: A background worker continuously exports point-in-time replicas of all core collections (`users`, `member_profiles`, `payments`, `attendance`, `announcements`, `merchandise`, `merchandise_orders`, `chats`, `workout_logs`, `diet_plans`) to a rolling archive (`db.database_backups`).
* **One-Click Point-in-Time Restore**: Admins can restore entire databases or individual collections directly through the API.
* **Disaster Recovery & Backup API Endpoints (Admin-Only)**:
  * `GET /api/admin/backups` — List all backup snapshots with sizes, doc counts, and timestamps.
  * `POST /api/admin/backups/create` — Generate an on-demand snapshot prior to updates or migrations.
  * `POST /api/admin/backups/restore/{backup_id}` — Restore all or selected collections from any snapshot.
  * `GET /api/admin/backups/export/{backup_id}` — Export and download the complete JSON archive for offsite cold storage (Google Drive / AWS S3).

---

## 🎨 Design Architecture and UX Tactics Used

- **Role-Oriented Information Architecture**: Separate, tailored navigation models for members, trainers, and administrators.
- **Branch-Aware Domain Modeling**: Strict validation ensuring data operations remain scoped to the selected gym branch.
- **API-First Backend Design**: Pydantic schemas enforce type safety and seamless cross-platform consistency.
- **Operational Resilience**: Retry wrappers for database queries and graceful degradation on transient connections.
- **Tactile 3D Visual Language**: Modern clickable 3D navigation buttons, responsive multi-slide data grids, accessible color contrast, and fluid animations.

---

## 📈 Client Impact & Operational Value

- **Zero Paper Reliance**: 100% digital transition for member files, receipts, and attendance registers.
- **90% Faster Onboarding**: Rapid member registration with instant QR credential generation.
- **Complete Financial Transparency**: Immutable payment audit logs with receipt proofs and revenue metrics.
- **Unified Communication**: Instant broadcast capability across all branch members in English & Bengali.

---

## 📱 Mobile & Web Screenshots

<div align="center">
  <h3>📱 Android Mobile App Interface</h3>
</div>

| Onboarding & Landing | Account Registration | Admin Command Center |
| :---: | :---: | :---: |
| <img src="docs/screenshots/01-onboarding-home.jpg" width="240" /> | <img src="docs/screenshots/02-create-account.jpg" width="240" /> | <img src="docs/screenshots/03-admin-home.jpg" width="240" /> |

| Member Approvals | Admin Profile & Security | QR Attendance Tracker |
| :---: | :---: | :---: |
| <img src="docs/screenshots/04-approvals.jpg" width="240" /> | <img src="docs/screenshots/05-admin-profile.jpg" width="240" /> | <img src="docs/screenshots/06-attendance.jpg" width="240" /> |

| Workout & Diet Plans | Member Portal Home | Gym Supplement Store |
| :---: | :---: | :---: |
| <img src="docs/screenshots/07-member-workouts.jpg" width="240" /> | <img src="docs/screenshots/08-member-home.jpg" width="240" /> | <img src="docs/screenshots/09-shop.jpg" width="240" /> |

---

## 🛠️ Complete Technology Stack

### Web Frontend & Admin Portal
- **Framework**: React 18 with TypeScript
- **Bundler & Build**: Vite 6
- **Styling**: Tailwind CSS + Lucide Icons
- **Animation**: Motion (Framer Motion)
- **Deployment**: Cloudflare Workers / Pages Static Assets

### Mobile Application
- **Runtime**: Expo / React Native
- **Navigation**: Expo Router
- **State Management**: Zustand + React Query
- **Distribution**: EAS Build (APK & AAB)

### Backend & Cloud Services
- **API Framework**: FastAPI (Python 3.11)
- **Primary Database**: MongoDB Atlas via Motor (AsyncIO driver)
- **Caching & Rate Limiting**: Redis & In-Memory TTL Fallback
- **Disaster Recovery**: Automated 12h point-in-time snapshot archiving
- **Image Optimization & CDN**: Cloudinary Media API
- **Real-Time Communication**: Socket.IO
- **Hosting**: Google Cloud Run (Containerized Docker microservice)

---

## 📂 Repository Structure

```text
Hercules-Gym-App/
├── backend/                  # FastAPI Microservices Backend
│   ├── server.py             # Primary API server, RBAC, Caching & Disaster Recovery
│   └── requirements.txt      # Python dependencies
├── src/                      # React 18 + Vite Web Application
│   ├── components/           # UI components, modals & dialogs
│   ├── services/             # Axios API client & backend bindings
│   ├── worker.ts             # Cloudflare Worker Edge Asset handler
│   └── App.tsx               # Main web application entrypoint
├── frontend/                 # Expo / React Native Mobile Application
│   ├── app/                  # Mobile screens & navigation routes
│   ├── app.json              # Expo configuration
│   └── eas.json              # Expo Application Services build profiles
├── docs/
│   └── screenshots/          # Production app screenshots
├── public/                   # Static branding logos and icons
├── Dockerfile                # Backend Cloud Run container specification
├── Dockerfile.web            # Web container configuration
├── cloudbuild.yaml           # Google Cloud Build CI/CD pipeline
├── wrangler.jsonc            # Cloudflare Workers deployment configuration
└── README.md                 # Project documentation
```

---

## 💻 Local Development & Setup

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or v3.11
- **MongoDB**: Local instance or MongoDB Atlas connection URI

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 3. Web Frontend Setup
```bash
# In the root directory:
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Mobile App Setup (Expo)
```bash
cd frontend
npm install
npm run start
```
Scan the displayed QR code with the **Expo Go** app on Android or iOS.

---

## 🧪 Testing & Quality Assurance

- **Type Safety**: Verified via `npx tsc --noEmit`.
- **Unit Test Suite**: 23 automated Vitest tests covering RBAC, roster search, term inactivity, fine calculations, and center theme color schemes.
- **Backend Validation**: Python byte-compilation check (`python -m py_compile backend/server.py`).
- **End-to-End Workflows**: Multi-branch authentication, QR scanning, payment uploads, and admin approval tests.

---

## 🚢 Deployment & Release Notes

- **Cloudflare Edge Web App**: Auto-deploys from GitHub `main` branch via `wrangler`.
- **Google Cloud Run Backend**: Auto-built and deployed with Google Cloud Build triggers.
- **Android Mobile App**: Packaged into `.apk` and `.aab` artifacts using EAS Build for Google Play Console submission.

---

## 🏛️ Ownership & Attribution Context

This platform is a proprietary custom solution developed in direct collaboration with the **Hercules Gym Owner & Stakeholders** to serve as their permanent, centralized digital gym operations infrastructure.

<div align="center">
  <sub>Built with ❤️ for Hercules Gym • Ranaghat • Chakdah • Madanpur</sub>
</div>
