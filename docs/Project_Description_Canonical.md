# 🧭 SiteFlow — Canonical Project Description (Complete, No-Detail-Left-Behind)

> **This is the SINGLE SOURCE OF TRUTH** for SiteFlow.  
> It consolidates every requirement and learning from previous docs, audits, chat logs, and fixes — including **Shadcn Admin UI**, **boilerplate compliance**, **coding & SaaS standards**, **i18n pitfalls & remedies**, **Daily Log approval + QC**, **Transactions with payment_status**, and **Share Link rules**.  
> Store at: `docs/Project_Description_Canonical.md`

---

## 0) Mission & Tenets

- **Mission**: Transparent construction management focused on **Daily Logs** and **Job Costing**.
- **Tenets**:
  1. MVP-first, pragmatic; Enterprise-ready extensibility.
  2. Readable, testable, migration-first code.
  3. Boilerplate compliance over “clever hacks”.
  4. Trust-by-Design: Approved logs only, QC verified, budget clarity.

---

## 1) Tech & Boilerplate Compliance

- **Framework**: Next.js 14 (App Router) + TypeScript (strict).
- **UI**: **Shadcn Admin UI** (shadcn/ui) + Tailwind.
  - Use official shadcn components: `Button, Card, Dialog, Drawer, DropdownMenu, Form, Input, Label, Select, Textarea, Badge, Tabs, Table, Avatar, Tooltip, Toast, Skeleton, Progress`.
  - **Admin shell**: Sidebar + Header + Content using shadcn primitives.
  - **DataTable**: use shadcn Table + TanStack patterns (no ad-hoc tables).
  - **No mixed UI libs**; no custom CSS hacks beyond Tailwind utilities.
- **Auth**: Clerk (Orgs + Roles).
- **DB**: PostgreSQL + Drizzle ORM (**migrations-first**).
- **i18n**: next-intl; **messages must live in `src/messages/en.json` & `src/messages/vi.json`** (not `src/locales`).
- **Media**: Cloudinary (`react-uploady` + `cloudinary-react` where applicable).
- **Validation**: Zod; **API errors**: RFC7807 JSON.
- **State/Data**: React Query (TanStack) for API caching.
- **A11y**: `@axe-core/react` in dev — **0 serious/critical** allowed.
- **Error Handling**: React 18 Error Boundaries with **i18n fallback UI**.
- **Testing**: Vitest (unit/integration), Playwright (E2E).
- **CI/CD**: GitHub Actions (lint, typecheck, unit, e2e, build).
- **Perf**: dynamic import where needed, image optimization, React Query keys stable, avoid waterfalls.

**Known pitfalls addressed**

- ❌ Wrong path `src/locales/*` → ✅ must use `src/messages/*`.
- ❌ axe-core only at page level → ✅ integrate in **RootLayout** dev-only.
- ❌ ErrorBoundary English-only → ✅ use `useTranslations('error')`.
- ❌ FR locale showing → ✅ **only `en`, `vi`** in `src/i18n.ts`.
- ❌ Header clutter (search/create/calendar) → ✅ **feature flags** to hide by default.

---

## 2) Roles & RBAC

**Roles**

- **OWNER/ADMIN**: all permissions.
- **ENGINEER**: create/edit Daily Logs (DRAFT/SUBMITTED), create Transactions (PENDING).
- **PM/SUPERVISOR**: approve/decline Daily Logs, comment.
- **QC**: assign `qc_rating` for Approved logs.
- **ACCOUNTANT**: update Transaction `payment_status` (PARTIAL/PAID).
- **CLIENT_VIEWER**: not a user; reads Share Link only.

**Permissions Matrix (essentials)**

| Resource           | ENGINEER | PM/SUP |   QC | ACCOUNTANT | ADMIN |
| ------------------ | -------: | -----: | ---: | ---------: | ----: |
| Project CRUD       |     View |   View | View |       View |  Full |
| Daily Log Create   |   Create |   View | View |       View |  Full |
| Daily Log Submit   |      Yes |      – |    – |          – |  Full |
| Approve/Decline    |        – |    Yes |    – |          – |  Full |
| QC Rate            |        – |      – |  Yes |          – |  Full |
| Transaction Create |  PENDING |   View | View | Create/Upd |  Full |
| Share Link         |     View |   View | View |       View |  Full |

RBAC enforced via Clerk + middleware; RLS recommended on DB (scope by `org_id`).

---

## 3) Canonical Data Model (Drizzle-style)

### `projects`

- `id uuid pk`, `org_id uuid not null`
- `name text not null`
- `status enum('planning','in_progress','on_hold','completed') not null default 'planning'`
- `start_date date not null`, `end_date date null`
- `budget_total numeric null`, `currency text not null default 'VND'`
- `description text null`, `thumbnail_url text null`
- `address text null`
- `scale jsonb null` **(e.g., { "area_m2": 120, "floors": 3, "notes": "" })**
- `investor_name text null`, `investor_phone text null`
- `created_at timestamptz not null`, `updated_at timestamptz not null`, `deleted_at timestamptz null`

### `categories` (no budget in MVP)

- `id uuid pk`, `project_id uuid`, `name text`, timestamps, soft-delete.

### `tasks`

- `id uuid`, `project_id`, `category_id`, `name text`,  
  `status enum('WAITING','IN_PROGRESS','DONE') default 'WAITING'`, timestamps.

### `daily_logs`

- `id uuid pk`, `project_id uuid`, `date date not null`
- `category_id uuid null`, `reporter_id text not null`
- `notes text`, `media jsonb[] not null` (≥1 required on FE)
- `status enum('DRAFT','SUBMITTED','APPROVED','DECLINED') default 'DRAFT'`
- `review_comment text null`
- `qc_rating smallint null` (1–5)
- timestamps, soft-delete.

### `daily_log_reviews` (Enterprise-ready audit; optional MVP)

- `id`, `daily_log_id`, `reviewer_id`, `action enum('COMMENT','APPROVE','DECLINE')`, `comment`, `created_at`

### `transactions`

- `id uuid pk`, `project_id uuid not null`, `date date not null`
- `type enum('ADVANCE','EXPENSE') not null`
- `amount numeric not null`, `currency text not null default 'VND'`
- `cost_type enum('MATERIAL','LABOR','EQUIPMENT','OTHER') not null`
- `description text`, `invoice_no text`, `vendor text`
- `payment_status enum('PENDING','PARTIAL','PAID') not null default 'PENDING'`
- `paid_amount numeric not null default 0`, `payment_date date null`
- `attachments jsonb[] null`
- audit fields.

### `media_assets`

- `id`, `project_id null`, `daily_log_id null`, `url`, `kind enum('image','video','document')`, `metadata jsonb`, `created_at`

### `share_links`

- `id`, `project_id`, `token`, `hide_finance boolean default false`,
  `show_investor_contact boolean default false`, `expires_at null`, `created_by`

**Soft-delete rule**: queries must filter `deleted_at is null`.

---

## 4) API v1 — Endpoints & Contracts

Base: `/api/v1` — JSON only, cursor pagination, Zod validation, RFC7807 errors.

### Projects

- `GET /projects?cursor=&limit=&status=&q=`
- `POST /projects` → create (RHF+Zod in UI)
- `GET /projects/:id`
- `PATCH /projects/:id`

**POST /projects (example body)**

```json
{
  "name": "Nhà anh A",
  "status": "planning",
  "start_date": "2025-10-01",
  "budget_total": 1250000000,
  "currency": "VND",
  "address": "Hà Nội, Việt Nam",
  "scale": { "area_m2": 120, "floors": 3 },
  "investor_name": "Anh A",
  "investor_phone": "+84901234567",
  "description": "Biệt thự 3 tầng"
}
```

### Daily Logs

- `GET /daily-logs?project_id=&status=&date_from=&date_to=&cursor=`
- `POST /daily-logs` → create **DRAFT** (Engineer)
- `PATCH /daily-logs/:id` → action-based:
  - `{"action":"submit"}` (Engineer)
  - `{"action":"approve","comment":"..."} ` (PM)
  - `{"action":"decline","comment":"..."} ` (PM)
  - `{"action":"qc","qc_rating":4}` (QC; only if APPROVED)

### Transactions

- `GET /transactions?project_id=&payment_status=&cursor=`
- `POST /transactions` → default `payment_status=PENDING`
- `PATCH /transactions/:id` → update payment (`PARTIAL`/`PAID`, `paid_amount`, `payment_date`, `attachments`)

### Share Link

- `GET /share/:token` → read-only: **only APPROVED logs**, KPI, QC badges, investor contact if `show_investor_contact=true`.

**Error format (RFC7807)**

```json
{
  "type": "https://siteflow.app/errors/validation",
  "title": "Invalid request body",
  "status": 400,
  "detail": "start_date must be a valid date",
  "errors": { "start_date": "Invalid date" }
}
```

---

## 5) Frontend — Admin Shell & Pages

**Admin Shell (Shadcn Admin UI)**

- `app/(shell)/layout.tsx`: Sidebar + Header + Content.
- **Header**: language switcher, theme toggle, user/org.
  - Feature flags (default off): `HEADER_SEARCH_ENABLED`, `HEADER_CREATE_ENABLED`, `HEADER_CALENDAR_ENABLED`.
- **Sidebar** (use i18n): Dashboard, Projects, Tasks, Daily Logs, Finance, Settings.

**Pages**

- **Dashboard**: KPI cards (Projects, Avg Progress, Budget Used / Budget Total, Over-budget count) + Project table.
- **Projects**: list + Create Project Modal (RHF + Zod + shadcn Form).
- **Daily Logs**: list + create/edit; PM queue for approvals; QC rating UI post-approval.
- **Finance**: Transactions list; Accountant control to mark as PAID & attach proofs.
- **Share**: public page for token.

**Components**

- ProgressBar, KPI Card, DataTable (sortable, paginated), ProjectCard, DailyLogCard, RatingStars, ReviewBadge, ErrorBoundary, AxeProvider.
- **i18n usage**: `useTranslations('namespace')` — **no hardcoded strings**.

---

## 6) i18n — Rules, Namespaces & Gotchas

- **Path**: `src/messages/en.json`, `src/messages/vi.json` (**only EN/VI**).
- `src/i18n.ts`:
  ```ts
  export const locales = ["en", "vi"] as const;
  export const defaultLocale = "en";
  ```
- Root Layout:
  ```tsx
  const messages = await getMessages(locale);
  <NextIntlClientProvider messages={messages}>...</NextIntlClientProvider>;
  ```
- **Namespaces** (suggested): `common`, `sidebar`, `header`, `dashboard`, `projects`, `dailyLogs`, `finance`, `error`.
- **Known issues fixed**: moved from `src/locales` → `src/messages`; removed FR; replaced hardcoded text; added ErrorBoundary i18n.

---

## 7) A11y, Error Boundaries, Quality

- **axe-core** in **RootLayout** dev-only; resolve all serious/critical.
- **ErrorBoundary** wraps auth/shell layouts; localized fallback:
  - EN: “Something went wrong. Please reload.”
  - VI: “Có lỗi xảy ra. Vui lòng tải lại.”
- Console must be clean in prod build; use `reportWebVitals` if needed.

---

## 8) Coding Standards (Backend & Frontend)

- TypeScript strict; `noImplicitAny`, `exactOptionalPropertyTypes`.
- ESLint + Prettier; no `console.log` in prod code.
- Foldering: `src/app`, `src/components`, `src/lib`, `src/server` (handlers), `src/models` (drizzle).
- API: POST/PUT/PATCH only accept JSON; return RFC7807 on errors; never redirect from API.
- DB: **migration-first**; each PR that touches schema must ship migrations.
- React Query: stable keys; caching times defined per resource.
- File uploads: validate mime/size; store Cloudinary public IDs and metadata.
- Soft-delete always respected in queries.

---

## 9) Security, Multitenancy & E2E

- All queries must filter by `org_id`.
- Consider Postgres RLS policies for tenant isolation.
- E2E dev bypass via headers; **never enabled in production**.
- Rate limiting for public endpoints (Share).
- PII (investor_phone) masked in logs; toggle on share to display or not.

---

## 10) Testing Strategy & Scenarios

- **Unit (Vitest)**: validators, utilities, formatting, RBAC guards.
- **Integration**: API handlers with test DB.
- **E2E (Playwright)**:
  1. Engineer creates log (DRAFT) → submit.
  2. PM approves → QC rates → Share page shows Approved card with QC badge.
  3. PM declines → comment visible → Engineer edits & resubmits.
  4. Transactions: create PENDING → Accountant marks PAID with attachment.
  5. i18n switching EN/VI across Dashboard/Projects/Daily Logs.
- Artifacts saved under `public/_artifacts/...`

---

## 11) Deployment & Ops

- Vercel for frontend; secure envs (Postgres, Clerk, Cloudinary).
- Migrations run on deploy (one-off job).
- Healthcheck `/api/health`.
- Backups for Postgres; retention policy.
- Sentry for error tracking.

---

## 12) MVP vs Enterprise (Field Tiers)

- **P0 (MVP)**: Projects (budget_total, address, scale, investor info), Daily Logs with approvals + QC rating, Transactions with payment_status, Share Link read-only (approved logs only).
- **P1**: weather/labor count in logs; vendor/tax details; weekly summary.
- **P2 (Enterprise)**: Category budgets/BOQ, CO/RFI, QAQC checklists, Safety, multi-reviewer audit trail, accounting integration.

---

## 13) Definition of Done (Canonical)

- All UI text via i18n; EN/VI parity.
- A11y: 0 serious/critical in dev.
- ErrorBoundary localized.
- DB migrations applied; seed OK.
- API contracts live and tested (unit/integration).
- E2E core flows green.
- Share Link shows **only Approved** logs; investor contact visibility toggle works.
- Header feature flags respected (search/create/calendar hidden by default).

---

## Appendix — Shadcn Admin UI Map

- Cards for KPI; Dialog for Create Project; Form components (RHF+Zod); Table for lists; Tabs for details; Badge for statuses; Avatar for managers; Tooltip for hints; Toast for success/error; Skeleton for loading; Progress for budget/progress bars.

**Do**: follow shadcn examples, keep composability.  
**Don’t**: introduce non-shadcn UI libs; avoid custom CSS spaghetti.

---

_End of Canonical Project Description_
