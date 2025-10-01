# 🏗️ Project Description — SiteFlow (Construction SaaS, Final Update)

## 20+) Project Metadata (Update)
- Bảng `projects` bổ sung field:
  - `start_date` *(date, required)*: ngày khởi công.
  - `end_date` *(date, optional)*: ngày dự kiến hoàn thành.
  - `description` *(text, optional)*: mô tả dự án.
  - `thumbnail_url` *(text, optional)*: ảnh đại diện dự án.

Schema:
```sql
projects (
  id uuid pk,
  name text not null,
  status project_status not null default 'PLANNING',
  thumbnail_url text,
  description text,
  start_date date not null,
  end_date date,
  org_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
)
```

---

## 21+) Project Members & Role Assignment (Refactor)

### Vấn đề
Thiết kế cũ dùng `managerIds`, `engineerIds`, `accountantIds` → cứng nhắc, khó mở rộng.

### Giải pháp
Dùng bảng `project_members` và một mảng `members[]` trong payload API để gán user vào nhiều vai trò khác nhau.

Schema:
```sql
project_members (
  id uuid pk,
  project_id uuid references projects(id),
  user_id text not null,   -- Clerk userId
  role text not null,      -- ví dụ: manager | engineer | accountant | safety_supervisor | design_engineer
  created_at timestamptz default now(),
  unique(project_id, user_id, role)
)
```

Payload khi tạo project:
```json
{
  "name": "Nhà phố Lê Lợi",
  "status": "PLANNING",
  "startDate": "2025-10-10",
  "endDate": "2026-05-30",
  "description": "Dự án xây dựng...",
  "thumbnailUrl": "https://res.cloudinary.com/...jpg",
  "members": [
    { "userId": "clerk_user_1", "role": "manager" },
    { "userId": "clerk_user_2", "role": "engineer" },
    { "userId": "clerk_user_3", "role": "accountant" },
    { "userId": "clerk_user_4", "role": "safety_supervisor" }
  ]
}
```

### Ưu điểm
- **Flexible**: thêm role mới không cần đổi API.
- **Consistent**: API thống nhất, dễ test.
- **Expandable**: role list có thể config, thậm chí quản lý qua bảng `roles` nếu cần.

---

## 22+) Modal Create Project (UI/UX chuẩn SaaS)

- Các trường trong form:
  - Name (bắt buộc)
  - Status (enum, bắt buộc)
  - Start Date (bắt buộc, DatePicker)
  - End Date (optional, DatePicker)
  - Thumbnail (optional, upload Cloudinary)
  - Description (optional, textarea)
  - Members (optional, dynamic list):
    - Select user (dropdown từ Clerk Org).
    - Select role (dropdown: manager, engineer, accountant, safety_supervisor, design_engineer, …).
    - Button “+ Add Member” → thêm dòng mới.

- Validation:
  - `startDate <= endDate` nếu có endDate.
  - `name` không rỗng.

- Sau khi submit:
  - Tạo project record.
  - Insert nhiều dòng vào `project_members`.
  - Dashboard refresh list, hiển thị project mới kèm avatar Manager + chip role khác.
