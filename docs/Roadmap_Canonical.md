# 🛣️ SiteFlow — Canonical Roadmap (Complete, No-Detail-Left-Behind)

> The roadmap merges all previous iterations, audits, and fixes into a single deliverable plan with strict acceptance, QA gates, and boilerplate/i18n/a11y compliance.
> Store at: `docs/Roadmap_Canonical.md`

---

## Phase 0 — Foundation & CI (Days 0–3)

**Tasks**

- Repo hygiene, branch protection.
- `.env.local` template (DATABASE*URL, CLERK*_, CLOUDINARY\__).
- `pnpm install`, `pnpm dev` smoke-tests.
- GitHub Actions: lint, typecheck, unit.
  **Acceptance**: Dev boot OK; CI green.

---

## Phase 1 — Schema & Migrations (Days 3–8)

**Tasks**

- Implement all tables from Canonical Description.
- Drizzle migrations + seed (`30 projects`, sample users/logs/transactions).
- Soft-delete and timestamps.
  **Acceptance**: `pnpm db:migrate` clean; seed verified (Drizzle Studio or psql).

---

## Phase 2 — RBAC & Multitenancy (Days 8–12)

**Tasks**

- Clerk roles; middleware guards per endpoint.
- (Optional) Postgres RLS policies for `org_id`.
- E2E bypass headers for dev/test.
  **Acceptance**: Unauthorized role gets 403; tenant isolation enforced.

---

## Phase 3 — Admin Shell & i18n (Days 12–18)

**Tasks**

- **Shadcn Admin UI** shell (Sidebar/Header/Content).
- i18n setup (**messages in `src/messages`**); FR removed; EN/VI only.
- AxeProvider in RootLayout (dev only).
- ErrorBoundary with i18n fallback.
- Hide Header extras via flags: search/create/calendar.
  **Acceptance**: Locale switch works; no missing messages; a11y dev violations = 0 serious/critical.

---

## Phase 4 — Core Features (Days 18–40)

### 4.D — Project Metadata Expansion (Days 18–24)

**Tasks**

- Add `budget_total`, `currency`, `address`, `scale`, `investor_name`, `investor_phone`.
- Update API (POST/PATCH/GET) + Zod.
- Update Create Project Modal (RHF+Zod+Shadcn) + i18n.
  **Acceptance**: New fields persisted & visible in UI; API validates; investor contact toggle plumbed for share settings.

### 4.E — Transactions Payment Flow (Days 24–28)

**Tasks**

- Fields: `payment_status`, `paid_amount`, `payment_date`, `attachments`.
- Role logic: ENGINEER creates PENDING; ACCOUNTANT updates PARTIAL/PAID.
- UI for payment updates + proof upload (Cloudinary).
  **Acceptance**: Lifecycle test PENDING→PAID passes; totals reflect spend.

### 4.F — Daily Log Workflow + QC (Days 28–36)

**Tasks**

- Daily Log `status`: DRAFT/SUBMITTED/APPROVED/DECLINED; `review_comment`; `qc_rating`.
- Endpoints: submit/approve/decline/qc.
- UI: Engineer submit; PM approve/decline with comment; QC star-rating post-approval.
  **Acceptance**: E2E flow green; declined shows comment; approved shows QC badge.

---

## Phase 5 — Share Link Pro (Days 36–45)

**Tasks**

- Public read-only timeline; **Approved logs only**.
- KPI header: Progress %, Budget Used vs Total.
- QC badges & stars; feature toggle for investor contact display.
- Responsive & SEO meta; i18n EN/VI.
  **Acceptance**: Public link renders cleanly; mobile good; no a11y serious issues.

---

## Phase 6 — QA Hardening & CI/E2E (Days 45–52)

**Tasks**

- Playwright scenarios:
  1. Engineer→PM→QC flow.
  2. Transactions PENDING→PAID.
  3. i18n switch EN/VI.
  4. Share Link shows approved logs only.
- Vitest coverage on validators/handlers.
- Sentry + healthcheck; DB backup policy.
  **Acceptance**: CI green; artifacts saved to `public/_artifacts/`.

---

## Phase 7 — Enterprise Extensions (Post-MVP)

- Category/Task budgets & BOQ import.
- CO/RFI workflows; QA/QC checklists; Safety logs.
- Accounting integrations; cost codes; multi-currency.
- Client-authenticated interactive feedback (optional).

---

## Global Acceptance & Gates

- **Boilerplate compliance**: Shadcn Admin UI, `src/messages/*` i18n, RFC7807, Drizzle migrations-first.
- **Coding standards**: TS strict, ESLint/Prettier, no console in prod.
- **SaaS standards**: multitenant by `org_id`, soft-delete, role guards, share tokens.
- **A11y**: 0 serious/critical in dev via axe-core.
- **Docs**: This roadmap + canonical description shipped; PR checklist enforced.

---

## Prompts (Cursor “Pig”) — Ready-to-Run

**1) Schema & Migration**

```
Implement canonical schema from docs/Project_Description_Canonical.md using Drizzle.
Create migrations, then run pnpm db:migrate and seed 30 projects + sample logs/transactions.
Log files changed into docs/PHASE_SCHEMA_LOG.md.
```

**2) i18n & Shadcn Admin UI**

```
Ensure all text is via next-intl messages in src/messages/en.json & src/messages/vi.json.
Remove FR; only en/vi. Integrate axe-core in RootLayout (dev only). Add ErrorBoundary with i18n.
Hide Header search/create/calendar via feature flags.
```

**3) Daily Log Workflow + QC**

```
Add actions submit/approve/decline/qc to /api/v1/daily-logs/:id.
Engineer can submit; PM approve/decline (with comment); QC set qc_rating for approved logs.
Update UI with pending queue for PM and stars for QC.
```

**4) Transactions Payment Flow**

```
Transactions default payment_status=PENDING. Accountant can update to PARTIAL/PAID with paid_amount, payment_date, attachments.
Reflect totals in Dashboard KPI.
```

**5) Share Link**

```
Public read-only page for /share/:token showing only APPROVED logs with QC badge + rating.
Respect toggles: hide_finance, show_investor_contact.
```

---

_End of Canonical Roadmap_
