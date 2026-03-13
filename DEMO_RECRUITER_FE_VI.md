# Kịch bản Demo SkillBridge (FE + Logic BE)

## 1) Mục tiêu buổi demo
Tài liệu này dùng để demo theo đúng chức năng đang chạy trong project hiện tại, không mô tả vượt quá code.

- Vai trò hỗ trợ: `CLIENT` và `FREELANCER`.
- Luồng nghiệp vụ chính: `job -> proposal -> accept -> contract -> notification`.
- Tập trung giải thích rõ điều kiện hiển thị ở FE và rule kiểm soát ở BE.

## 2) Chuẩn bị nhanh trước khi demo
Bạn đã chạy được FE/BE, nên chỉ cần nhắc lại checklist này:

```powershell
# Backend
cd d:\project\skillbridge\freelancer-job-matching-system
docker compose up -d postgres rabbitmq
docker compose up -d --build
pwsh ./scripts/seed-demo.ps1

# Frontend
cd d:\project\skillbridge\freelancer-job-matching-system-fe
Copy-Item .env.example .env.local -Force
npm install
npm run dev
```

Mở sẵn:
- FE: `http://localhost:3000`
- Gateway Swagger: `http://localhost:8080/swagger-ui.html`

Tài khoản seed:
- `client.demo@skillbridge.local / Demo12345!`
- `freelancer.demo@skillbridge.local / Demo12345!`

## 3) Luồng demo đề xuất (12-15 phút)

### Phút 0-2: Login/Register và cơ chế phiên
Thao tác:
1. Vào `/register` tạo nhanh 1 tài khoản mới (hoặc dùng seed).
2. Vào `/login` đăng nhập.

Điểm kỹ thuật để nói:
- FE validate trước khi gửi:
  - Email hợp lệ.
  - Password >= 8 ký tự.
  - Register bắt buộc khớp `confirmPassword`, password có chữ + số.
- Session lưu `localStorage` key `skillbridge.auth.session`.
- Request protected tự đính JWT (`Authorization: Bearer ...`).
- Nếu `401`, FE tự gọi `/auth/refresh` đúng 1 lần rồi retry request.

Code tham chiếu:
- FE: `src/lib/validation.ts`, `src/lib/auth-storage.ts`, `src/lib/http-client.ts`, `src/components/auth-guard.tsx`
- BE: `services/auth-service/src/main/java/com/skillbridge/auth_service/service/AuthService.java`

### Phút 2-6: Jobs list, search/filter, create job
Thao tác:
1. Đăng nhập tài khoản `CLIENT`.
2. Vào `/jobs`.
3. Gõ keyword ở ô search, chọn status `OPEN` hoặc `CLOSED`, bấm `Refresh`.
4. Tạo job mới ở panel `Create Job (Client)`.

Giải thích đúng câu hỏi của bạn về search/filter:
- FE gửi query qua `listJobs({ keyword, status })`.
- `keyword` và `status` được gắn vào URL query nếu không rỗng.
- BE filter như sau:
  - `keyword`: tìm trong `title` hoặc `description` (không phân biệt hoa thường).
  - `status`: so sánh đúng enum `OPEN` hoặc `CLOSED`.

Logic thực tế:
- FE: `src/app/(app)/jobs/page.tsx`
- FE API: `src/lib/api.ts` (`listJobs`)
- BE filter: `services/job-service/src/main/java/com/skillbridge/job_service/service/JobService.java` (`listJobs`, `keywordContains`)
- BE endpoint: `services/job-service/src/main/java/com/skillbridge/job_service/controller/JobController.java` (`GET /jobs`)

Lưu ý khi demo:
- Badge `X open jobs` là FE tự đếm từ danh sách đã lọc hiện tại (`job.status === "OPEN"`), không phải số tổng toàn hệ thống.

### Phút 6-8: Job detail và apply proposal
Thao tác:
1. Mở job detail `/jobs/[id]`.
2. Đăng nhập tài khoản `FREELANCER` ở cửa sổ khác.
3. Submit proposal.

Rule đang áp dụng:
- FE chỉ hiện form apply nếu:
  - user là `FREELANCER`, và
  - `job.status === "OPEN"`.
- Nếu job `CLOSED`, FE hiện thông báo không cho apply.
- BE chặn thêm:
  - chỉ `FREELANCER` được tạo proposal,
  - job phải đang `OPEN`,
  - 1 freelancer không apply trùng cùng job.

Code tham chiếu:
- FE: `src/app/(app)/jobs/[id]/page.tsx`
- BE: `services/proposal-service/src/main/java/com/skillbridge/proposal_service/service/ProposalService.java` (`createProposal`)

### Phút 8-11: CLIENT accept proposal -> tạo contract
Thao tác:
1. Quay lại tài khoản `CLIENT`.
2. Vào `/dashboard/client`.
3. Chọn job, xem proposals, bấm `Accept proposal`.

Logic backend:
- Chỉ `CLIENT` mới accept được.
- CLIENT phải là chủ job tương ứng proposal.
- Proposal từ `PENDING` -> `ACCEPTED`.
- Sau đó proposal-service gọi nội bộ contract-service tạo contract + default milestone.
- Đồng thời publish event `proposal.accepted` để notification-service tiêu thụ.

Code tham chiếu:
- FE: `src/app/(app)/dashboard/client/page.tsx`, `src/lib/api.ts` (`acceptProposal`)
- BE proposal: `services/proposal-service/src/main/java/com/skillbridge/proposal_service/service/ProposalService.java` (`acceptProposal`)
- BE contract: `services/contract-service/src/main/java/com/skillbridge/contract_service/service/ContractService.java` (`createContractFromProposal`)

### Phút 11-13: FREELANCER xem contract + notification
Thao tác:
1. Vào `/dashboard/freelancer`.
2. Xem danh sách contract và milestones.
3. Vào notifications, bấm `Mark as read`.

Logic:
- `unread count` là FE đếm `!notification.read`.
- `Mark as read` gọi `PATCH /notifications/{id}/read`, chỉ update nếu notification thuộc user hiện tại.

Code tham chiếu:
- FE: `src/app/(app)/dashboard/freelancer/page.tsx`
- BE: `services/notification-service/src/main/java/com/skillbridge/notification_service/service/NotificationService.java`
- Event consumer: `services/notification-service/src/main/java/com/skillbridge/notification_service/messaging/NotificationEventConsumer.java`

### Phút 13-15: Profile và upload CV
Thao tác:
1. Vào `/profile`.
2. Thử update thông tin theo role.
3. Với freelancer, upload CV.

Rule:
- FE tách form theo role.
- BE cũng chặn chéo role:
  - CLIENT không được cập nhật `skills/hourlyRate/overview/address`.
  - FREELANCER không được cập nhật `companyName/companyAddress`.
- CV upload chỉ cho `FREELANCER`, định dạng PDF/DOC/DOCX, tối đa 5MB.

Code tham chiếu:
- FE: `src/app/(app)/profile/page.tsx`
- BE: `services/user-service/src/main/java/com/skillbridge/user_service/service/UserProfileService.java`

## 4) Trả lời trực tiếp câu hỏi: khi nào job thành CLOSED?

Hiện tại code đang như sau:
- BE có API đóng job: `PATCH /jobs/{jobId}/close`.
- Điều kiện đóng:
  - user phải là `CLIENT`,
  - user phải là chủ job (`job.clientId == principal.userId`).
- Khi đóng thành công:
  - `status` đổi sang `CLOSED`,
  - set `closedAt = Instant.now()`.

Code nguồn:
- `services/job-service/src/main/java/com/skillbridge/job_service/controller/JobController.java`
- `services/job-service/src/main/java/com/skillbridge/job_service/service/JobService.java` (`closeJob`)

Điểm quan trọng để demo đúng:
- FE hiện chưa có nút `Close job`.
- Nghĩa là để tạo case `CLOSED`, bạn cần gọi API bằng Swagger/Postman/curl.

Ví dụ curl:
```bash
curl -X PATCH "http://localhost:8080/jobs/{jobId}/close" \
  -H "Authorization: Bearer <client_access_token>"
```

Sau đó quay lại `/jobs`, chọn filter status `CLOSED` sẽ thấy job vừa đóng.

## 5) Danh sách chức năng đang có (theo UI FE)

1. Landing page `/` với CTA vào Login/Register/Jobs.
2. Register `/register` có chọn role `CLIENT` hoặc `FREELANCER`.
3. Login `/login` hỗ trợ redirect theo `?next=`.
4. Guard route private bằng `AuthGuard`.
5. Top navigation hiển thị role/email hiện tại + sign out.
6. Jobs page:
   - Search keyword.
   - Filter status `OPEN/CLOSED`.
   - Refresh list.
   - Create job (chỉ CLIENT).
7. Job detail:
   - Xem thông tin job.
   - Apply proposal (chỉ FREELANCER, chỉ khi job OPEN).
8. Dashboard client:
   - Danh sách job của client.
   - Danh sách proposal theo job.
   - Accept proposal.
   - Danh sách contracts.
9. Dashboard freelancer:
   - Danh sách contracts + milestones.
   - Danh sách notifications.
   - Mark notification as read.
10. Profile:
   - Update thông tin theo role.
   - Upload CV cho freelancer.

## 6) Tính năng BE đã có nhưng FE chưa mở nút thao tác

1. `PATCH /jobs/{jobId}/close` (đóng job).
2. `POST /contracts/{contractId}/milestones` (thêm milestone).
3. `PATCH /milestones/{milestoneId}/complete` (complete milestone).

Bạn có thể demo thêm qua Swagger để thể hiện khả năng mở rộng FE trong bước tiếp theo.

## 7) Tóm tắt 60 giây khi chốt demo
"Frontend đang bám chặt business rules của backend thay vì chỉ render UI. Mọi luồng chính đã khép kín: đăng nhập, tạo job, apply proposal, accept proposal, sinh contract/milestone và nhận notification. Với mỗi action, FE kiểm soát điều kiện hiển thị theo role/trạng thái, còn BE tiếp tục enforce bằng security + validation để tránh thao tác sai. Riêng case đóng job đã có API `PATCH /jobs/{id}/close` ở backend, FE chưa bật nút nên thao tác qua Swagger/Postman khi cần demo trạng thái `CLOSED`."
