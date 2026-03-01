# School Performance Charter System
## نظام ميثاق الأداء الوظيفي

### Current Status: ✅ COMPLETE & FUNCTIONAL

The application is a Saudi Ministry of Education-compliant Performance Charter (ميثاق الأداء الوظيفي) system with two indicator types (Goals & Competencies), weighted scoring, mandatory teacher onboarding, and ministry-standard printable charter reports.

---

## What Was Built

### ✅ Complete Features Implemented:

1. **Authentication System**
   - Replit OAuth integration (Google, GitHub, Email)
   - Session management with PostgreSQL session store
   - Token refresh and expiration handling
   - Protected routes and API endpoints
   - Role-based access control (Teacher/Principal)

2. **Database Layer**
   - 13 tables: users, sessions, indicators, criteria, witnesses, strategies, userStrategies, capabilities, changes, signatures, academicCycles, auditLogs, notifications, performanceStandards
   - Users: fullNameArabic, jobNumber, specialization, mobileNumber, onboardingCompleted fields
   - Indicators: type (goal/competency), weight (1-100%), domain (values/knowledge/practice), targetOutput
   - Performance Standards: 11 ministry-standard records with dynamic API (GET /api/standards)
   - PostgreSQL with Neon serverless
   - Drizzle ORM with TypeScript types
   - 18 strategies, 12 capabilities, 12 changes, 11 performance standards pre-seeded

3. **Onboarding System**
   - Mandatory teacher profile completion before system access
   - Mobile number field with Saudi format validation (05XXXXXXXX) - required during onboarding
   - Mobile number displayed in teacher profile cards
   - Mobile number editable in profile edit form
   - Duplicate prevention: mobile number-based account merge with session migration
   - Job number validation (numeric, 4+ digits)
   - Arabic full name required
   - Specialization, school, department, subject fields
   - Automatic redirect until onboarding is complete

4. **Performance Charter (ميثاق الأداء)**
   - Two indicator types: Goals (أهداف الأداء الوظيفي) and Competencies (الجدارات المهنية)
   - Weighted scoring system totaling 100% per category
   - Weight validation with visual progress bars
   - Tab-based dashboard separating Goals and Competencies
   - Domain classification for competencies (values/knowledge/practice)
   - Target output field for goals
   - Official ministry-format printable charter report

5. **Multi-Role System**
   - **Creator Role** (منشئ الموقع): Site-wide user management, assign any role to users, all principal permissions
   - **Principal/Admin Role**: View all teachers, approve/reject indicators, school-wide statistics
   - **Supervisor Role**: Future expansion for department oversight
   - **Teacher Role**: Create indicators, manage criteria, add witnesses, submit for approval
   - Role hierarchy: creator > admin > supervisor > teacher
   - Automatic role-based routing
   - Data isolation between teachers

6. **Signature Approval Workflow**
   - Teachers submit completed indicators for principal approval
   - Status tracking: pending → approved/rejected
   - Principal can add approval notes
   - Rejection requires reason

7. **Smart Evidence System (مساعد الشواهد الذكي)**
   - Dynamic performance standards loaded from database (GET /api/standards) - 11 ministry standards
   - Fallback to local constants if database unavailable
   - `witness-upload-modal.tsx`: Split-view layout with upload area + smart evidence suggestions (replaces old AddWitnessModal)
   - `evidence-review-modal.tsx`: Split-view with file preview + rubric checklist for principals
   - Standards matched to indicator titles automatically
   - Suggested evidence list from ministry standards
   - Smart cards for witness list: colored icon backgrounds (red=PDF, green=image, blue=video), file type badges
   - Clicking witness card opens split-view EvidenceReviewModal directly (principal dashboard)

8. **Automatic Image Compression**
   - Uses `browser-image-compression` library
   - Compresses uploaded images to max 0.8MB, max 1920px dimension
   - Shows compression progress with spinner animation
   - Displays before/after file size comparison
   - Non-image files pass through uncompressed
   - Integrated into WitnessUploadModal (split-view)

9. **Grid of Cards UI**
   - Teacher dashboard: 3-column responsive grid (lg:3, md:2, sm:1)
   - Principal dashboard: 3-column grid for indicators + 2-column smart cards for witness list
   - Status-colored right borders (green=completed, amber=in_progress, gray=pending)
   - Indicator-specific icons map (not generic) for both dashboards
   - Icon + title + weight badge card headers with Progress component
   - Skeleton loading states for cards
   - Empty state placeholders with call-to-action buttons
   - Pending signatures: card grid with teacher avatar, indicator icon, progress bar, approve/reject buttons
   - Witness smart cards: 2-column grid with colored icon backgrounds + file type badges

10. **Frontend Application**
    - Landing page (non-authenticated users)
    - Teacher dashboard (/home) with Grid of Cards
    - Onboarding page (/onboarding) with mobile number field
    - Principal dashboard (/principal) with Grid of Cards
    - Indicator management (CRUD operations)
    - Witness/evidence management with smart suggestions
    - Strategies selection interface
    - Full RTL Arabic interface
    - Light/dark theme toggle
    - Responsive design
    - CSS print media queries (hide sidebar/buttons during print, full-page charter)
    - Offline awareness banner (detects network loss, warns user about unsaved changes)

11. **Backend API**
    - 20+ REST endpoints
    - Stats aggregation for both roles
    - Indicator CRUD with criteria tracking
    - Signature management
    - Principal-only protected endpoints
    - User profile management
    - Dynamic standards API (GET /api/standards)

---

## Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite build system
- Wouter routing
- TanStack Query for state
- Shadcn UI components
- Tailwind CSS + RTL support
- browser-image-compression for automatic image compression

**Backend:**
- Express.js + TypeScript
- Drizzle ORM
- PostgreSQL (Neon)
- Passport.js for auth
- isPrincipal middleware for role checks

**Design:**
- Arabic RTL layout
- Material Design adapted
- Cairo/Tajawal fonts
- Light/dark modes
- Professional educational theme
- Grid of Cards layout with status colors

---

## Key Components

### Modals
- `witness-upload-modal.tsx` - Split-view: upload area + smart evidence suggestions from DB
- `evidence-review-modal.tsx` - Split-view: file preview + rubric checklist for principals
- `print-report-modal.tsx` - Ministry-format printable charter report
- `add-indicator-modal.tsx` - Create new indicator (goal/competency)
- `add-witness-modal.tsx` - Quick witness addition
- `strategies-modal.tsx` - Teaching strategies selection

### Pages
- `landing.tsx` - Public landing page
- `onboarding.tsx` - Mandatory profile completion with mobile number
- `home.tsx` - Teacher dashboard with Grid of Cards
- `principal.tsx` - Principal dashboard with Grid of Cards

### Shared
- `constants.ts` - Local fallback performance standards + mapDbStandardToUI helper
- `schema.ts` - Database schema with all tables and types

---

## How to Use

### For Teachers

1. **Login**
   - Click "تسجيل الدخول" on landing page
   - Authenticate via Replit auth
   - Complete onboarding (name, job number, mobile, specialization, etc.)

2. **Add Indicators**
   - Click "إضافة مؤشر جديد"
   - Choose type: goal or competency
   - Enter title, description, weight, criteria

3. **Upload Witnesses**
   - Click "إضافة شاهد" on any indicator card
   - Smart suggestions panel shows recommended evidence
   - Images auto-compressed on upload

4. **Submit for Approval**
   - Click "تقديم للاعتماد" on completed indicators
   - Wait for principal review

### For Principals

1. **Access Dashboard** - Login with admin role, auto-redirected to /principal
2. **Review Indicators** - Browse teachers, view their indicators in grid format
3. **Review Evidence** - Click witness to open split-view preview with rubric checklist
4. **Approve/Reject** - Approve with notes or reject with reason

---

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   ├── landing.tsx       (public landing page)
│   │   ├── onboarding.tsx    (mandatory profile + mobile)
│   │   ├── home.tsx          (teacher dashboard - Grid of Cards)
│   │   └── principal.tsx     (principal dashboard - Grid of Cards)
│   ├── components/
│   │   ├── witness-upload-modal.tsx   (smart evidence upload)
│   │   ├── evidence-review-modal.tsx  (principal review split-view)
│   │   ├── print-report-modal.tsx     (official charter report)
│   │   ├── add-indicator-modal.tsx
│   │   ├── strategies-modal.tsx
│   │   ├── theme-toggle.tsx
│   │   └── ui/               (shadcn components)
│   └── lib/
│       ├── constants.ts      (performance standards fallback)
│       └── queryClient.ts
├── server/
│   ├── app.ts               (Express setup)
│   ├── routes.ts            (API endpoints + /api/standards)
│   ├── storage.ts           (Database operations + findUserByMobile)
│   ├── db.ts                (Drizzle connection)
│   └── replitAuth.ts        (Replit OAuth + isPrincipal)
├── shared/
│   └── schema.ts            (Database schema + performanceStandards table)
└── package.json
```

---

## API Endpoints

### Public
- `GET /api/auth/callback` - OAuth callback

### Teacher Endpoints
- `GET /api/user` - Current user
- `POST /api/onboarding` - Complete onboarding (with mobileNumber)
- `PATCH /api/user` - Update profile (with mobileNumber + merge logic)
- `GET /api/stats` - Dashboard statistics
- `GET /api/indicators` - User's indicators
- `POST /api/indicators` - Create indicator
- `PATCH /api/indicators/:id/criteria/:id` - Toggle criterion
- `POST/GET /api/indicators/:id/witnesses` - Witness management
- `GET/POST /api/user-strategies` - Strategy selection
- `POST /api/signatures` - Submit for approval
- `GET /api/my-signatures` - View submission status
- `GET /api/standards` - Dynamic performance standards from DB

### Principal Endpoints (Protected)
- `GET /api/principal/stats` - School statistics
- `GET /api/principal/teachers` - All teachers list
- `GET /api/principal/teachers/:id/indicators` - Teacher's indicators
- `GET /api/principal/pending-signatures` - Pending approvals
- `POST /api/principal/signatures/:id/approve` - Approve indicator
- `POST /api/principal/signatures/:id/reject` - Reject indicator

---

## Data Isolation

- Teachers can only view/edit their own indicators
- Teachers can only submit their own indicators for approval
- Signatures are linked to specific teacher-indicator pairs
- Principal can view all teachers but cannot modify their data
- Mobile numbers have unique constraint to prevent duplicates

---

## Deployment

The application is ready to publish with `npm run build` and will be available at a Replit app URL.

To deploy:
1. Click Publish in Replit
2. App will be hosted with TLS
3. Database will be automatically managed

---

**Status:** ✅ Ready for Production
**Last Updated:** February 14, 2026
**Language:** Arabic (RTL)
**Audience:** Teachers, Principals, School Administrators
**Footer Credit:** الصفحة من إعداد عبدالعزيز الخلفان
