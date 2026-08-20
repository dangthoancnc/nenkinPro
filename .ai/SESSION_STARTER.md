# SESSION_STARTER
<!-- File này dùng để khởi động phiên mới giữa PE và AN. Đọc kỹ trước khi bắt đầu. -->

## 🔢 Bộ Đếm Câu Trả Lời
- **PE tiếp theo**: #37
- **AN tiếp theo**: #37

---

## 📌 Trạng Thái Sprint Hiện Tại

| Sprint | Nội dung | Trạng thái |
|--------|----------|------------|
| R5-S1  | Tạo SQL Views v_equipment_type_summary | ✅ ĐÃ ĐÓNG |
| R5-S2  | Tạo SQL Views v_job_status_summary | ✅ ĐÃ ĐÓNG |
| R5-S3  | Xử lý giới hạn 1.000 dòng / verify Live DB | ✅ ĐÃ ĐÓNG |

### Kết quả Nghiệm Thu R5-S3 (PE verify — 2026-08-20)
- **v_equipment_type_summary**: MOLD 6.252 | CUTTER_SEPARATE 1.283 | STACKING 121 | Tổng **7.737** ✅
- **v_job_status_summary**: COMPLETED 1.194 | NEW 999 | IN_PROGRESS 4 | Tổng **2.197** ✅
- Lỗi giới hạn 1.000 dòng đã được xử lý dứt điểm bằng SQL Views đúng kỹ thuật.

---

## ⚠️ BACKLOG (Không Khẩn)

### [BL-001] jobs.overall_progress chưa cập nhật
- **Vấn đề**: Toàn bộ 2.197 dòng `jobs.overall_progress` = 0 (không có NULL, chỉ là default schema = 0).
- **Nguyên nhân**: Trigger / logic cập nhật tiến độ job khi `job_status` chuyển sang `COMPLETED` chưa được triển khai.
- **Tác động**: `avg_progress` trong v_job_status_summary trả về 0.00 cho mọi nhóm kể cả COMPLETED.
- **Hướng xử lý** (chưa quyết định):
  1. Rà soát và thêm trigger cập nhật `overall_progress = 100` khi job chuyển COMPLETED.
  2. Hoặc bỏ field này khỏi Widget 2 nếu nghiệp vụ không track tiến độ theo %.
- **Ưu tiên**: LOW — không chặn nghiệm thu, xử lý phiên sau.

---

## 🏗️ Tình Trạng Hệ Thống
- **Dự án**: ysdms-next (Quản lý sản xuất khay nhựa YSD)
- **Repo**: https://github.com/dangthoancnc/nenkinPro
- **Supabase**: https://nwaxlfuztnismocuuoyc.supabase.co
- **Stack**: Next.js (App Router) + TypeScript + Supabase PostgreSQL
- **Môi trường**: Ổn định. Live DB đang hoạt động.

## 📋 Các Phase Đã Hoàn Thành
- M1–M3 cũ (Hệ thống Khách hàng & OCR) ✅
- M4 (Form Generator docxtemplater + Zod) ✅
- M1–M3 mới (Responsive UI, Onboarding Wizard, Staff Review) ✅
- R5-S1, R5-S2, R5-S3 (SQL Views Dashboard, xử lý limit 1000) ✅

---

## 📐 Quy Tắc Phối Hợp PE-AN
1. PE thiết kế chỉ thị → AN thực thi → Thoan xác nhận → PE nghiệm thu.
2. Mọi thay đổi schema phải qua migration có tên rõ ràng.
3. Không hardcode ID trong data migration.
4. Khi thảo luận vượt ~20 lượt → mở thảo luận mới, AN cập nhật SESSION_STARTER trước.
5. AN commit xong → trả link commit cho Thoan → Thoan chuyển cho PE verify.

---

## 🔗 Tài Liệu Tham Chiếu
- `AI_SYSTEM_RULES.md` — Quy tắc hệ thống AI
- `SCHEMA_REFERENCE.md` — Schema DB tham chiếu
- `PE_AN_COORDINATION_LOG.md` — Log điều phối PE-AN
- `SETUP_GUIDE.md` — Hướng dẫn cài đặt môi trường
