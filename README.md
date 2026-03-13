# SkillBridge Frontend

Next.js frontend for the SkillBridge freelance marketplace.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file from template:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open:

`http://localhost:3000`

Default backend gateway URL is `http://localhost:8080` via `NEXT_PUBLIC_API_BASE_URL`.

## Implemented Pages

- `/login`
- `/register`
- `/jobs`
- `/jobs/[id]`
- `/dashboard/client`
- `/dashboard/freelancer`

## Current Flow

1. Register/Login and store access + refresh token in localStorage.
2. Auto-attach JWT to protected API requests.
3. Auto-refresh token once when protected request returns `401`.
4. Freelancer can apply proposal from job detail.
5. Client can review proposals and accept from dashboard.
6. Freelancer can view contracts + notifications and mark notifications as read.

## Demo (Tạm Thời - Tiếng Việt)

Đã thay phần demo cũ bằng tài liệu demo chi tiết mới (có giải thích logic code FE/BE):

- `DEMO_RECRUITER_FE_VI.md`

Nội dung trong tài liệu demo mới gồm:

1. Luồng demo 12-15 phút theo từng bước thao tác.
2. Giải thích search/filter job `OPEN`/`CLOSED` đang dựa trên query nào.
3. Cách chuyển job sang `CLOSED` bằng API `PATCH /jobs/{jobId}/close`.
4. Tổng hợp toàn bộ chức năng hiện có và rule theo role.

## Quality Checks

```bash
npm run lint
npm run build
```
