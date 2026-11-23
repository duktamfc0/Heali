# Quyền Riêng Tư & Bảo Mật Dữ Liệu — Heali

> **Lưu ý pháp lý quan trọng:** Phần tóm tắt chính sách dữ liệu cá nhân dưới đây là **BẢN NHÁP KỸ THUẬT** được viết dễ hiểu. **Cần luật sư tại Việt Nam xác nhận theo quy định hiện hành về Bảo vệ Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP và các văn bản liên quan) trước khi phát hành công khai** vì dữ liệu về cảm xúc và sức khỏe tinh thần thuộc nhóm dữ liệu nhạy cảm.

---

## 1. Dữ liệu nào được lưu ở đâu và ai nhìn thấy?

| Loại dữ liệu | Mục đích | Nơi lưu & Bảo vệ | Ai nhìn thấy? |
|---|---|---|---|
| **Tài khoản ẩn danh** (`users`) | Tạo phiên dùng không cần email/SĐT | SQLite (`data/heali.db`). Token xác thực dùng `crypto.randomBytes(32)` và chỉ lưu bản băm HMAC-SHA256. | Chỉ hệ thống nhận diện phiên của chính bạn. |
| **Mã PIN riêng tư** | Chống người cầm chung thiết bị mở xem Nhật ký & Thư | Chỉ lưu bản băm `scrypt` ngẫu nhiên trên server. **Không bao giờ** trả PIN hay hash về trình duyệt. Yêu cầu mở khóa qua header `x-heali-pin-token` giới hạn số lần thử. | Không ai đọc được kể cả quản trị viên. |
| **Nhật ký, Check-in tâm trạng, Thư chưa gửi** | Không gian riêng tư của bạn | Mã hóa AES-256-GCM khi lưu vào SQLite (`_enc` columns). | **Chỉ bạn** khi đã xác thực token (và mở PIN nếu bật). |
| **Nghi thức "Hoá tro (xoá hẳn)"** | Giải tỏa và kết thúc lưu trữ một bức thư | Ghi đè rỗng các cột mã hóa rồi thực hiện `DELETE` vĩnh viễn khỏi SQLite. Không thể khôi phục. | Biến mất hoàn toàn sau khi xác nhận. |
| **Bài Tâm tình, Hoa đăng, Điều ước** | Chia sẻ cộng đồng ẩn danh | Lưu trong SQLite. Bài có mức rủi ro ≥ 2 được giữ ở hàng đợi kiểm duyệt, chưa hiện công khai. | Cộng đồng (trừ các bài chờ duyệt). |
| **Chat 1:1 ẩn danh** | Trò chuyện thời gian thực | Chỉ giữ tối đa 100 tin tạm trong RAM trong lúc phòng đang mở; tự hủy khi rời phòng. Không lưu lịch sử chat 1:1 xuống cơ sở dữ liệu. | Chỉ hai người trong phòng (trừ trường hợp có báo cáo vi phạm). |
| **Gửi ngọn đèn (`/den/:token`)** | Chia sẻ 1 lời nhắn dịu dàng cho bạn | Chỉ dùng token ngẫu nhiên, mặc định hết hạn sau 14 ngày; không lộ nhật ký hay hồ sơ người gửi. Có nút **Không muốn nhận** xóa sạch lời nhắn ngay. | Chỉ người giữ liên kết cho tới khi hết hạn hoặc bấm tắt. |
| **Chỉ số lành mạnh (`healthy_metric_events`)** | Đánh giá công cụ hữu ích (Phần 8.4) | Chỉ lưu mã sự kiện tổng hợp (không gắn `user_id`, không lưu chữ viết). Cho phép tắt hoàn toàn (`analyticsOptOut`). | Quản trị nội bộ xem số đếm tổng hợp ẩn danh trên `/admin`. |
| **Góp ý thử nghiệm (`beta_feedback`)** | Tiếp nhận góp ý cải thiện app | Lưu văn bản góp ý ẩn danh không gắn tài khoản. | Quản trị nội bộ trên `/admin`. |

---

## 2. Quyền kiểm soát của bạn (Tích hợp trong Hồ sơ & Quyền riêng tư)

1. **Xuất dữ liệu cá nhân (`GET /api/auth/export`):** Tải xuống toàn bộ nhật ký, thư chưa gửi (đã giải mã cho chính chủ) và check-in tâm trạng dưới dạng tệp JSON bất cứ lúc nào.
2. **Mã khôi phục thiết bị (`POST /api/auth/recovery/generate`):** Tạo mã khôi phục một lần để mang tài khoản sang máy khác mà không cần email.
3. **Xoá toàn bộ tài khoản (`DELETE /api/auth/account`):** Xoá ngay lập tức và vĩnh viễn tài khoản, nhật ký, thư, check-in, hoa đăng, điều ước và bài viết liên kết.
4. **Từ chối đo lường tổng hợp (Opt-out):** Công tắc bật/tắt ngay trong `Quyền riêng tư & An toàn` (`analyticsOptOut`), chặn mọi sự kiện `/api/metrics/event` ngay tại trình duyệt.
5. **Không quảng cáo, không theo dõi bên thứ ba:** Heali không nhúng tracker quảng cáo và không bán hoặc dùng nội dung riêng tư để huấn luyện AI.

---

## 3. Rà soát & Sao lưu vận hành

- Cơ sở dữ liệu nằm trong thư mục `data/` (đã đưa vào `.gitignore`, không nằm trong mã nguồn).
- Máy chủ hỗ trợ tạo bản sao lưu xoay vòng bằng `sqliteDb.backup(...)` (tối đa 7 bản gần nhất) và hàm `verifyBackupAndRestore()` kiểm tra tính toàn vẹn `PRAGMA integrity_check` của bản khôi phục, đồng thời đảm bảo các bức thư đã **Hoá tro** hoặc tài khoản đã **Xoá** không tồn tại trong bản sao lưu mới.
- Không ghi log nội dung bài viết, nhật ký hay tin nhắn người dùng ra console hoặc tệp log lỗi.
