# 🛣️ Roadmap — SiteFlow (Final Update With Metadata & Members)

## 📊 Phase 4 — Progress & Project Management (Update)

### Phase 4.A.1 — Dashboard Refactor
*(giữ nguyên như bản final)*

### Phase 4.A.2 — Project Metadata & Role Assignment
**Mục tiêu:**
- Bổ sung field `start_date` cho projects.
- Refactor luồng Create Project để assign nhiều role linh hoạt.

**Công việc:**
- Migration thêm `start_date` vào projects.
- Update schema `projects` và `project_members`.
- Refactor API `/api/v1/projects` để nhận `members[]`.
- Update modal Create Project (FE) với các trường Start Date, End Date, Members[].
- Thêm validation: `startDate ≤ endDate`.

**Acceptance ✅:**
- Tạo project thành công với start_date + end_date.
- DB có record trong `projects.start_date`.
- `project_members` có nhiều user với role khác nhau.
- Dashboard hiển thị manager avatar + roles.
- Console sạch, test pass.

**Báo cáo:** Screenshot DB, API response, UI modal.
