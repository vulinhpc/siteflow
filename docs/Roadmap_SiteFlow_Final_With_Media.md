# 🛣️ Roadmap — SiteFlow SaaS (Reboot)

> Lộ trình chi tiết để Cursor AI (lợn 🐷) thực thi từng phase, **bám sát Project_Description.md**.  
> Mỗi phase có: Mục tiêu → Công việc → Lệnh thực thi → Kiểm tra/Acceptance → Báo cáo.

---

## 🔰 Phase 0 — Setup & Foundation
**Mục tiêu:** Môi trường dev ổn định, CI/CD cơ bản, boilerplate chạy OK.

**Công việc:**
- Clone repo từ GitHub.
- Cài đặt dependencies.
- Thiết lập `.env.local` với `DATABASE_URL`, `CLERK_SECRET_KEY`.
- Cấu hình GitHub Actions cho lint, typecheck, test, e2e.
- Bật branch protection + PR template + CODEOWNERS.

**Lệnh thực thi:**
```bash
pnpm install
pnpm dev
```

**Kiểm tra/Acceptance ✅:**
- `pnpm dev` chạy OK, localhost hiển thị.
- Clerk login hiển thị trang login.
- CI workflow chạy qua Pull Request.

**Báo cáo:** Commit + push branch `phase-0-setup`.

---

## 🧱 Phase 1 — Database Schema & Migration
**Mục tiêu:** Schema domain chuẩn với 8 bảng, migration-first.

**Công việc:**
- Viết `src/models/Schema.ts`.
- Tạo 8 bảng: projects, categories, tasks, daily_logs, daily_log_tasks, media_assets, transactions, share_links.
- Ràng buộc: tasks.categoryId → categories.id; daily_logs.categoryId; daily_log_tasks.dailyLogId + taskId.
- Enum Postgres: project_status, task_status, log_task_status, media_kind, transaction_type.
- Audit fields, soft delete, orgId.
- Viết seed script `src/scripts/seed.ts`.

**Lệnh thực thi:**
```bash
pnpm db:generate
pnpm db:migrate
pnpm tsx src/scripts/seed.ts
```

**Kiểm tra/Acceptance ✅:**
- Migration chạy OK.
- Seed script in ra `Seed OK`.
- `psql \dt` đủ 8 bảng.

**Báo cáo:** Commit branch `phase-1-schema`.

---

## 🔐 Phase 2 — RBAC & Security
**Mục tiêu:** Multi-tenant isolation + role-based access.

**Công việc:**
- Tích hợp Clerk Orgs + Roles (`ADMIN, PM, ENGINEER, ACCOUNTANT`).
- Viết `roles.ts`, `context.ts`, `withRole.ts`.
- Bật RLS cho 8 bảng: `org_id = current_setting('app.current_org')::uuid`.
- Migration file: `xxxx_enable_rls.sql`.
- Thêm HTTP headers: CSP, HSTS, Referrer-Policy, Permissions-Policy.
- Endpoint demo: `/api/v1/_rbac-check`.

**Lệnh thực thi:**
```bash
pnpm db:migrate
pnpm dev
```

**Kiểm tra/Acceptance ✅:**
- SQL test: SELECT sai org → FAIL.
- API `/api/v1/_rbac-check` trả 403 nếu sai role, 200 nếu đúng.
- Browser response đủ headers.

**Báo cáo:** Commit branch `phase-2-rbac`.

---

## 🔌 Phase 3 — API v1
**Mục tiêu:** CRUD chuẩn REST, validation.

**Công việc:**
- Tạo route handlers:
  - `/api/v1/projects`
  - `/api/v1/categories`
  - `/api/v1/tasks`
  - `/api/v1/daily-logs`
  - `/api/v1/daily-log-tasks`
  - `/api/v1/transactions`
  - `/api/v1/share-links`
  - `/api/v1/cloudinary/sign`
- Validation: Zod.
- Error: RFC7807 format.
- Cursor-based pagination.
- Soft delete filter.
- OpenAPI spec.

**Lệnh thực thi:**
```bash
pnpm dev
pnpm test
```

**Kiểm tra/Acceptance ✅:**
- Postman CRUD chạy OK.
- Error JSON theo RFC7807.
- Pagination hoạt động.
- Không trả record soft deleted.

**Báo cáo:** Commit branch `phase-3-api`.

---

## 📊 Phase 4 — Progress Service

### Phase 4.A.1 — Dashboard Refactor (Shadcn Admin)

**Mục tiêu:** Refactor Dashboard để follow UI/UX của Shadcn Admin Demo.  

**Công việc:**  
- Tạo `ShellLayout` (Header + Sidebar).  
- Sidebar canonical + responsive.  
- Header: thông tin user/org, i18n switcher, nút Create Project.  
- Dashboard content: KPI cards, bảng danh sách, modal tạo project (RHF + Zod).  
- Dark/Light theme toggle.  
- Fake user = OWNER để bypass auth.  

**Acceptance ✅:**  
- `/dashboard` giống giao diện Shadcn Admin Demo.  
- Sidebar + header hoạt động responsive.  
- Modal tạo project hoạt động với validate.  
- Console sạch, UI không vỡ mobile.  

**Mục tiêu:** Tính tiến độ realtime.

**Công việc:**
- Postgres views: `category_progress`, `project_progress`.
- Service: `getCategoryProgress`, `getProjectProgress`.
- API: `/api/v1/categories/:id/progress`, `/api/v1/projects/:id/progress`.
- Unit + integration test.

**Lệnh thực thi:**
```bash
pnpm db:migrate
pnpm test
```

**Kiểm tra/Acceptance ✅:**
- Công thức đúng.
- Status lấy từ daily_log_tasks (fallback tasks.status).
- Project progress = weighted average.

**Báo cáo:** Commit branch `phase-4-progress`.

---


### Phase 4.C — Project Members & User Sync

**Mục tiêu:** Cho phép gán user từ Clerk Org vào project với vai trò cụ thể.  
**Công việc:**  
- Migration: tạo bảng `users` và `project_members`.  
- API Create Project: thêm logic sync user và insert project_members với role=manager.  
- Webhook Clerk: sync org members vào bảng users.  
- Join project_members + users khi trả project list.  

**Acceptance ✅:**  
- Invite user mới → users table cập nhật.  
- Create project → project_members có manager.  
- Dashboard hiển thị avatar manager.  

**Báo cáo:** Screenshot DB, API response, Dashboard list.

---

### Phase 4.D — Project Metadata mở rộng

**Mục tiêu:** Lưu và hiển thị metadata mở rộng cho project.  
**Công việc:**  
- Migration: thêm cột `thumbnail_url`, `end_date`, `description` vào projects.  
- API projects: update payload + validation.  
- Dashboard: hiển thị thumbnail + estimated end date.  

**Acceptance ✅:**  
- Create project với thumbnail, end date → lưu thành công.  
- GET projects → trả thêm các field mới.  
- Dashboard hiển thị dữ liệu đúng.  

**Báo cáo:** Screenshot API + UI.

---

### Phase 4.E — Dev Bypass & Testing Helpers

**Mục tiêu:** Cho phép dev/test nhanh không cần Clerk login.  
**Công việc:**  
- Middleware nhận headers `x-e2e-bypass`, `x-e2e-user`, `x-e2e-org`.  
- Khi bật bypass, set context user = OWNER.  
- Document rõ cách dùng trong README.  

**Acceptance ✅:**  
- Dev/test có thể truy cập dashboard không cần login.  
- API CRUD chạy OK với bypass.  

**Báo cáo:** Screenshot chạy dev với bypass ON.


## 🖼️ Phase 5 — Media & Upload
**Mục tiêu:** Quản lý media assets.

**Công việc:**
- API `/api/v1/cloudinary/sign`, `/api/v1/media-assets`.
- Component FE: `UploadButton.tsx`.
- Liên kết media với DailyLog.

**Lệnh thực thi:**
```bash
pnpm dev
pnpm test
```

**Kiểm tra/Acceptance ✅:**
- Upload Cloudinary OK.
- Metadata lưu DB.
- UI preview hiển thị.

**Báo cáo:** Commit branch `phase-5-media`.

---

## 👩‍🎨 Phase 6 — UI
**Mục tiêu:** Giao diện đầy đủ, canonical routes.

**Công việc:**
- Dashboard: KPI cards, project list, filters, modals.
- Project Detail: tabs Overview, Tasks, Daily Logs, Finance, Share Links.
- Public Share Page `/share/[token]`.
- Sidebar canonical (không `/dashboard/projects`).
- A11y test bằng axe-core.

**Lệnh thực thi:**
```bash
pnpm dev
pnpm test:e2e
```

**Kiểm tra/Acceptance ✅:**
- Tabs điều hướng đúng.
- Console sạch.
- Finance cảnh báo over-budget.
- Share link public hiển thị.

**Báo cáo:** Commit branch `phase-6-ui`.

---

## 🧪 Phase 7 — Testing & CI
**Mục tiêu:** Đảm bảo chất lượng tự động.

**Công việc:**
- Unit test: schema, RBAC, progress.
- Integration test: API CRUD, progress, upload.
- E2E test: Dashboard → Project → Share.
- Accessibility test (axe-core).
- Perf test (k6).
- CI pipeline auto run.

**Lệnh thực thi:**
```bash
pnpm test
pnpm test:e2e
```

**Kiểm tra/Acceptance ✅:**
- Unit, integration, e2e đều pass.
- CI xanh.

**Báo cáo:** Commit branch `phase-7-testing`.

---

## 🚀 Phase 8 — Deploy & Monitoring
**Mục tiêu:** Production stable, có giám sát.

**Công việc:**
- FE deploy Vercel, DB deploy Render/Neon.
- Monitoring: Sentry + Grafana/DataDog.
- Alerts: Slack/email.
- Backup cross-region.

**Lệnh thực thi:**
```bash
pnpm build
pnpm start
```

**Kiểm tra/Acceptance ✅:**
- Prod chạy OK.
- Error log về Sentry.
- Restore DB backup OK.

**Báo cáo:** Commit branch `phase-8-deploy`.

### Phase 5 — Media Upload & Gallery (Updated)

**Mục tiêu:** Quản lý media assets (ảnh cho project thumbnail, daily logs).  

**Công việc:**  
- Cài đặt react-uploady + cloudinary-react.  
- API /api/v1/cloudinary/sign → ký upload.  
- FE UploadGallery component: preview + upload nhiều ảnh.  
- Metadata lưu DB (media_assets table).  
- Dashboard hiển thị project thumbnail.  
- Project Detail hiển thị daily log gallery.  

**Acceptance ✅:**  
- Upload nhiều ảnh thành công → DB lưu metadata.  
- Thumbnail project hiển thị trên Dashboard.  
- Daily log gallery hiển thị preview + zoom.  

**Báo cáo:** Screenshot upload widget, API payload, gallery view.
