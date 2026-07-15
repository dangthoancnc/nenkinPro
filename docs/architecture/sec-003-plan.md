# Kế hoạch triển khai SEC-003: Customer Portal Authentication & PIN Hardening

Dựa trên điều kiện phê duyệt nghiêm ngặt từ PE, đây là bản thiết kế kiến trúc và bảo mật bắt buộc đối với luồng xác thực trên Customer Portal (Kế thừa nền tảng của SEC-002).

## Quyết định cốt lõi (10 Điều kiện bắt buộc)

1. **KHÔNG tự động hash năm sinh cũ**: Chấm dứt việc sử dụng năm sinh cũ làm mã PIN đăng nhập.
2. **Khách cũ chuyển sang trạng thái PIN_RESET_REQUIRED**: Bắt buộc phải thông qua luồng đổi PIN trước khi đăng nhập Portal.
3. **PIN mới do khách tự đặt qua reset flow có xác minh**: Không dùng DOB, số thẻ (card number), customer code hay tên làm yếu tố reset độc lập.
4. **CustomerSession an toàn**: Dùng token 32-byte, lưu DB ở dạng SHA-256 hash-only, giới hạn 1 active session/customer, và TTL là 24 giờ.
5. **Cookie mới an toàn**: Tên cookie `nenkin_customer_session`, với các thuộc tính HttpOnly, Secure (trên production), SameSite=Lax, Path=/.
6. **Xóa/ignore hoàn toàn cookie portal_auth cũ**: Đây là cookie chứa nguyên raw customer ID, không còn hiệu lực.
7. **Login response không chứa secret**: Không trả về token, password hash hoặc customerId trong JSON response.
8. **Portal DTO được lọc chặt (Minimal DTO)**: DTO portal không được trả về `myNumber`, bank account đầy đủ, OCR raw, internal staff data hay URL giấy tờ public/dài hạn.
9. **Chỉ chứa Metadata giấy tờ**: URL tài liệu không nằm trong phạm vi SEC-003. Response DTO chỉ trả metadata (VD: loại giấy tờ và trạng thái chờ nhận/đã nhận). Tính năng signed URL/private storage sẽ nằm ở SEC-004.
10. **Migration additive-only**: Production chỉ được dùng `npx prisma migrate deploy`. Không drop, không reset data.

---

## Các thành phần triển khai

### 1. Database Schema (Additive-only)
Sẽ chạy migration local `init_customer_session` để thêm bảng `nenkin_customer_sessions` và cột `pinResetRequired` cho bảng `nenkin_customers`.

```prisma
model CustomerSession {
  id         String    @id @default(uuid())
  tokenHash  String    @unique
  customerId String
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  lastSeenAt DateTime  @default(now())
  ipHash     String?
  userAgent  String?

  @@index([customerId])
  @@index([expiresAt])
  @@map("nenkin_customer_sessions")
}
```

*Trong `Customer` model:*
```prisma
  // Thêm cột trạng thái
  pinResetRequired Boolean @default(false)
  // passwordPin vẫn giữ nguyên String? nhưng lưu trữ Argon2id hash
```

### 2. Quản lý Session & Cookie
- **Mã PIN**: Băm bằng `Argon2id` trước khi lưu vào `passwordPin`.
- **Hàm `revokeAllCustomerSessions(customerId)`**: Thực thi mỗi khi login thành công (để đảm bảo 1 thiết bị) hoặc khi PIN được reset.
- **Set Cookie**: Đặt cookie `nenkin_customer_session` thay vì trả chuỗi token ra response.

### 3. API Portal Endpoint (`/api/portal/auth/login` và `/api/portal/auth/me`)
- Login chỉ nhận vào identifier (`code` hoặc `cardNumber`) và `pin`. Trả về `{ success: true }`.
- API `/me` (lấy dữ liệu Portal) phải áp dụng hàm `toCustomerPortalDTO(customer)`.
- **`toCustomerPortalDTO`**:
  - `myNumber`: xóa khỏi object.
  - `accountNumber`: che số `****1234`.
  - Không có raw OCR.
  - Documents: chỉ map ra array `{ type: 'Passport', status: 'RECEIVED' }`.

### 4. Bổ sung Test Cases
Viết E2E hoặc API test kiểm tra:
- Cookie `portal_auth` cũ bị từ chối.
- Login thành công không lộ secret.
- Trạng thái `PIN_RESET_REQUIRED` bị chặn login.
- Đổi PIN/Reset PIN làm revoke session cũ.
- Session hết hạn hoặc revoked sẽ bị trả 401.
- Truy cập chéo (Customer A xem C) bị trả 403.
- DTO không lộ dữ liệu nhạy cảm.
- Vượt ngưỡng nhập sai PIN (Rate limit).
