# THIẾT KẾ DỮ LIỆU (SCHEMA)

Tài liệu này định nghĩa cấu trúc dữ liệu mới được bổ sung và chuẩn hóa cho giai đoạn Phase 1 Foundation Refactoring.

## 1. Cơ chế Audit Log

Bảng `AuditLog` được thiết kế dưới dạng Append-Only (Chỉ thêm mới, không sửa/xóa) nhằm lưu trữ toàn bộ lịch sử thay đổi trạng thái của hệ thống, phục vụ cho truy vết và kiểm toán.

### 1.1. Prisma Schema

Đoạn mã sau sẽ được thêm vào `prisma/schema.prisma`:

```prisma
enum EntityType {
  CUSTOMER
  APPLICATION
}

model AuditLog {
  id          String     @id @default(uuid())
  entityId    String     // ID của Customer hoặc NenkinApplication
  entityType  EntityType // Loại đối tượng bị thay đổi
  fromState   String     // Trạng thái trước khi chuyển (vd: DRAFT)
  toState     String     // Trạng thái sau khi chuyển (vd: SENT_1ST)
  actionBy    String     // ID của người dùng (User hoặc Customer) thực hiện
  actionAt    DateTime   @default(now()) // Thời gian thực hiện chuyển đổi
  metadata    Json?      // Lưu JSON chi tiết: lý do từ chối (revision note), IP, User-Agent, hoặc các fields thay đổi quan trọng
  
  @@index([entityId, entityType])
  @@index([actionAt])
  @@map("nenkin_audit_logs")
}
```

## 2. Chuẩn hóa State Machine cho NenkinApplication

Việc chuyển đổi trạng thái (status) của `NenkinApplication` phải tuân thủ nghiêm ngặt các quy tắc dưới đây, đảm bảo toàn vẹn dữ liệu ở mỗi bước.

### 2.1. Guard Clauses (Điều kiện chuyển đổi)

| Từ Trạng Thái | Sang Trạng Thái đích (`toState`) | Điều kiện dữ liệu bắt buộc (Guard Clauses) |
| :--- | :--- | :--- |
| `PENDING` | `DRAFT` | Bắt buộc `Customer` có: `fullName`, `dob`, `zairyuAddress`. |
| `DRAFT` | `SENT_1ST` | Bắt buộc `Customer` có ảnh: `zairyuFrontUrl`, `zairyuBackUrl`, `passportUrl`, `nenkinBookUrl`. <br/> Bắt buộc: `applyDate`, `nenkinNumber`. |
| `SENT_1ST` | `RECEIVED_1ST` | Bắt buộc: `noticeDate`, `noticeImageUrl`, `totalExpectedJpy`, `received1stJpy`. |
| `RECEIVED_1ST` | `SENT_2ND` | Bắt buộc: `taxRepresentativeId` (phải tồn tại), `sent2ndDate`. |
| `SENT_2ND` | `RECEIVED_2ND` | Bắt buộc: `received2ndDate`, `received2ndJpy`, `tax2ndJpy`. |
| `RECEIVED_2ND` | `COMPLETED` | Bắt buộc: `serviceFeeJpy`, `exchangeRate`, `serviceFeeVnd`. |
| *(Bất kỳ trạng thái nào)* | `REVISION_REQUIRED`| Bắt buộc có dữ liệu trong `revisionNote` (giải thích lý do). |

> **Lưu ý:** Bất kỳ sự thay đổi trạng thái (status) nào cũng sẽ kích hoạt một Trigger/Hook ở tầng Application Logic để tự động lưu vào bảng `AuditLog` ở trên.
