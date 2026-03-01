# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Development Commands

- **Dev server**: `npm run dev` — starts Express + Vite HMR on port 5000 (or `PORT` env)
- **Build**: `npm run build` — Vite builds client to `dist/public/`, esbuild bundles server to `dist/index.js`
- **Start production**: `npm start` — runs the built `dist/index.js`
- **Type check**: `npm run check` — runs `tsc` with no emit
- **Push DB schema**: `npm run db:push` — runs `drizzle-kit push` to sync schema to the database
- **Run all tests**: `npm run test` — runs `vitest run`
- **Run a single test**: `npx vitest run tests/logic.test.ts`

Tests live in `tests/` and use Vitest with Node environment. The test alias `@shared` resolves to `shared/`.

## Architecture Overview

Full-stack TypeScript monorepo for a Saudi education performance charter system (نظام توثيق شواهد الأداء الوظيفي) — teachers document professional indicators and evidence, principals review and approve them.

### Three-layer structure

- **`client/`** — React 18 SPA. Entry at `client/src/main.tsx`, routing via **Wouter** (not React Router). State management via **TanStack Query**. UI built with **Shadcn UI** (New York style) + **Radix UI** primitives + **Tailwind CSS**.
- **`server/`** — Express.js backend. Two entry points: `index-dev.ts` (Vite middleware for HMR) and `index-prod.ts` (static file serving). `app.ts` sets up Express, `routes.ts` registers all API endpoints, `storage.ts` implements `IStorage` interface for all DB operations.
- **`shared/`** — Single file `schema.ts` containing all Drizzle ORM table definitions, relations, Zod insert schemas, and TypeScript types. This is the single source of truth for the data model, imported by both client and server.

### Path Aliases

Defined in `tsconfig.json` and `vite.config.ts`:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*` (Vite only)

### Database

PostgreSQL via **Neon Serverless**. ORM is **Drizzle ORM** with `drizzle-zod` for validation. Connection in `server/db.ts`. Migrations output to `migrations/`. Schema in `shared/schema.ts`.

Key tables: `users`, `indicators`, `criteria`, `witnesses`, `strategies`, `userStrategies`, `capabilities`, `changes`, `signatures`, `academicCycles`, `auditLogs`, `notifications`, `performanceStandards`, `surveys`, `surveyQuestions`, `surveyResponses`.

### Authentication (Dual System)

1. **Replit OAuth** (OIDC) — active when `REPL_ID` env is present. Handled in `server/replitAuth.ts`.
2. **Custom session-based auth** — teacher login via national ID + mobile number (`/api/auth/teacher/login`), admin login via password (`/api/auth/login`).

Both use `express-session` with PostgreSQL session store (`sessions` table). The `getUserIdFromRequest` helper checks session auth first, then falls back to OAuth claims.

### Role Hierarchy

`creator` > `admin` > `supervisor` > `teacher`

Middleware in `replitAuth.ts`: `isAuthenticated`, `isPrincipal` (admin or creator), `isCreator`, `isSupervisor`. Teacher data is isolated by userId. Principal routes are prefixed `/api/principal/`.

### Server Services (`server/services/`)

- `cycles.ts` — `CycleService`: manages academic cycles; auto-creates a default if none exists. Indicators are scoped to the active cycle.
- `notification.ts` — `NotificationService`: in-app notification CRUD.
- `audit.ts` — `AuditService`: writes audit log entries.
- `email.ts` — Uses **Resend** SDK. Gracefully mocks when `RESEND_API_KEY` is missing.

### Frontend Patterns

- **Routing**: Wouter `<Switch>/<Route>`. Role-based redirect logic in `App.tsx` — admins → `/principal`, teachers needing onboarding → `/onboarding`.
- **Data fetching**: TanStack Query. The `apiRequest` helper in `lib/queryClient.ts` sets `credentials: "include"`. Query keys use API path strings (e.g., `["/api/user"]`).
- **Auth hook**: `useAuth()` in `hooks/useAuth.ts` — returns `{ user, isLoading, isAuthenticated, loginMutation, registerMutation, logoutMutation }`.
- **UI components**: Shadcn in `components/ui/`. App-specific modals and cards in `components/`. Survey builder in `components/survey/`.
- **Zustand store**: `lib/survey-store.ts` for survey builder state.
- **Performance standards**: Loaded from DB (`/api/standards`) with local fallback in `lib/constants.ts`.

## RTL & Arabic-First Design

The entire UI is Arabic right-to-left. When modifying or adding UI:
- All text alignment defaults to right
- Use Cairo/Tajawal font stack (configured in `tailwind.config.ts`)
- Follow the design system in `design_guidelines.md` for spacing, typography, and component patterns
- Status colors: green = completed, amber = in_progress, gray = pending
- Dark mode supported via class-based toggling (`next-themes`)

## Environment Variables

Required: `DATABASE_URL`, `SESSION_SECRET`
Optional: `PORT` (default 5000), `REPL_ID` (enables Replit OAuth), `ADMIN_PASSWORD`, `RESEND_API_KEY`, `OPENID_CLIENT_ID`, `OPENID_CLIENT_SECRET`, `OPENID_ISSUER`

## Agent Handover Protocol (from .cursorrules)

When collaborating in a multi-agent workflow:
- **Developer** must not modify database schemas (`shared/schema.ts`) without Architect approval
- No commits/pushes before QA approval
- When handing off work, summarize changed files with full paths
