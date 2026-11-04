# Jobs & Micro-Business Funding Platform (Sri Lanka) - Rakiya Abimana 🇱🇰

An MVP monorepo platform designed for Sri Lanka connecting job seekers, verified employers, micro-business entrepreneurs seeking non-repayable grants or micro-loans, and ethical funders. Built with a responsive, high-accessibility UI tailored for mobile devices and low-literacy users.

---

## Architecture & Technology Stack

The application code is separated into two top-level workspaces: `client/` is the frontend and `server/` is the backend. Run either workspace on its own with the frontend/backend commands below, or start both with `npm run dev`.

```
rakiya-abimana/
├── server/                      # Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma        # Complete PostgreSQL relational schema
│   │   └── seed.ts              # Seeds 25 districts, master data & demo users for all 7 roles
│   ├── src/
│   │   ├── routes/              # Auth, Users, Verification, Jobs, Pitches, Messages, Admin, Master
│   │   ├── services/            # AES-256 crypto, NIC verification hook, Haversine geospatial, Translation
│   │   ├── middleware/          # Auth JWT cookie check, Role-based route guards, Multer upload
│   │   └── constants/           # 25 Sri Lanka districts, trades, categories, sectors
│   └── uploads/                 # Multer storage for Grama Niladhari & business registration proofs
└── client/                      # Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
    ├── messages/                # Trilingual messages (en.json, si.json, ta.json)
    └── src/
        ├── app/                 # Next.js App Router pages
        ├── components/          # Navbar, VerifiedBadge, LanguageSwitcher, MachineTranslationNotice
        ├── context/             # AuthContext, LanguageContext
        └── lib/                 # Centralized API fetch client
```

### Key Technologies
- **Client**: Next.js 14 App Router, TypeScript, Tailwind CSS, `next-intl` (English, Sinhala `සිංහල`, Tamil `தமிழ்`), React Context.
- **Server**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (httpOnly cookies), Multer file uploads.
- **Security**: AES-256-GCM encryption at rest for NIC numbers. Raw NIC documents are restricted strictly to Verifier and Admin roles.
- **Geospatial Matching**: Haversine distance calculations within `MATCH_RADIUS_KM` (approximate coordinates exposed; exact coordinates protected).
- **Zero Financial Intermediation**: No money movement takes place on the platform. Pledges and expressions of interest are informational only.

---

## Demo Accounts & Logins

All demo accounts share the following password:
> **Password**: `Password123!`

| Role | Email | Name & Location | Key Features to Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rakiya.lk` | Nimal Perera (Colombo) | User management, soft deactivation, role assignments, system settings, master data, audit trail |
| **Verifier** | `verifier@rakiya.lk` | Sita Rajapakse (Colombo) | Verifier queue, inspect decrypted NICs, Grama Niladhari certs, review pitches with reason |
| **Job Seeker** | `kamal.seeker@rakiya.lk` | Kamal Wickramasinghe (Colombo) | Browse jobs, nearby geospatial jobs, view translated job descriptions, track applications |
| **Job Seeker** | `priya.seeker@rakiya.lk` | Priyadarshini Selladurai (Jaffna) | Accounts clerk profile, bilingual messaging, track application status |
| **Employer** | `sunil.employer@rakiya.lk` | Sunil Jayasuriya (Gampaha) | Verified employer badge, publish jobs, auto-translation, filter applicants |
| **Entrepreneur** | `anura.entrepreneur@rakiya.lk` | Anura Bandara (Kandy) | Verified entrepreneur badge, published honey apiary pitch, view funder pledges |
| **Entrepreneur** | `fatima.entrepreneur@rakiya.lk` | Fatima Noor (Galle) | Pending verification status, submit Grama Niladhari certificate, draft pitch |
| **Funder** | `lanka.funder@rakiya.lk` | Dilshan Samarasekera (Colombo) | Filter pitches by district, submit pledge expressions & interest (zero money movement) |
| **Training Provider** | `vocational.training@rakiya.lk` | SL Vocational Institute | Vocational institution directory listing |

---

## Quick Start & Installation

### 1. Prerequisites
- Node.js v18+ and npm v9+
- PostgreSQL database (or local PostgreSQL cluster)

### 2. Configure Environment Files

**Backend Environment (`server/.env`)**:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/jobs_platform"
JWT_SECRET="rakiya_abimana_jwt_super_secret_key_2026_lk"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
MATCH_RADIUS_KM=50
TRANSLATION_PROVIDER="mock" # Pluggable: "google"
VERIFICATION_HOOK="standard" # Pluggable: "gov_live_stub"
CLIENT_URL="http://localhost:3000"
```

**Frontend Environment (`client/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
npm run prisma:push --workspace=server
npm run seed --workspace=server
```
The seed command is safe to rerun: it restores demo account passwords and roles and does not delete existing users or database records.

### 5. Run Both Server & Client
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

To run or build one side independently:
```bash
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

---

## Features & Implementation Summary

### 1. Accounts & Access
- Registration consent checkbox for Terms & Privacy Notice with recorded ISO timestamp (`termsAcceptedAt`).
- Role assignment and soft deactivation (`isActive: false`) by Administrators.
- 25 Sri Lanka districts seeded with names in English, Sinhala, and Tamil alongside approximate geographical coordinates.
- Trilingual UI language switcher (English, Sinhala, Tamil) persisted in the database per user account.

### 2. Identity & Business Verification
- **NIC Formats**: Validates both Old format (9 digits + `V`/`X`) and New format (12 digits).
- **Automated DOB Check**: Extracts birth year and day of year (using Sri Lankan DRP 366-day calendar) and automatically checks against the user's entered date of birth. This result is system-set and cannot be edited.
- **AES-256-GCM Encryption**: NIC numbers are encrypted at rest with authentication tags. Only Verifiers and Admins can view decrypted NICs and uploaded documents.
- **Verification Workflow**: Verifiers review pending requests and approve or decline with a mandatory rejection reason. The "Verified" badge is automatically displayed across profiles, jobs, and pitches upon approval.

### 3. Job Management & Geospatial Matching
- **Nearby Jobs**: Calculated using the great-circle Haversine formula based on either user GPS coordinates (with consent) or district center fallback, filtered within `MATCH_RADIUS_KM`.
- **Privacy Safeguard**: The API strictly serves rounded coordinates (~1.1 km area) and district names; raw exact GPS coordinates are never exposed.
- **Guest Limitations**: Guests see overview cards but must sign in to view full employer contact details or submit job applications.

### 4. Micro-Business Funding Pitches
- Verified entrepreneurs submit pitches for micro-loans or non-repayable grants.
- Funders filter verified pitches by district and submit non-binding pledges.
- **Strictly No Money Movement**: All transactions, banking, and contract disbursements remain external.

### 5. Translation Pipeline & Messaging
- `ITranslationProvider` interface with a rich offline Sri Lankan dictionary (`MockTranslationProvider`) and pluggable Google Translate provider (`GoogleTranslationProvider`).
- Automatic pre-translation of job postings, pitches, and chat messages into reader's language.
- Database cache (`TranslationCache`) avoids redundant translation calls.
- "Machine-translated" labels and one-click toggle to view original text.

---

## What is Stubbed & Future Integrations

1. **Live Government NIC Registry Check**:
   - `GovernmentLiveVerificationStub` in `server/src/services/nic.service.ts` validates the algorithm and format, while providing an interface stub for future Department of Registration of Persons (DRP) live API integration.
2. **Google Cloud Translation API**:
   - Pluggable via setting `TRANSLATION_PROVIDER="google"` and providing `GOOGLE_TRANSLATE_API_KEY` in `server/.env`. Defaults to `MockTranslationProvider`.
3. **Voice-First Navigation**:
   - Designed for low-literacy users with high-contrast, large touch-target buttons and icons; voice transcription/audio playback endpoints are ready to be integrated as audio modules.
