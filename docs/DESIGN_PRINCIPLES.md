# Nguyên Tắc Thiết Kế & Kiến Trúc Sản Phẩm — Heali

Thứ tự ưu tiên bất biến của Heali trong mọi quyết định thiết kế và kỹ thuật:

`An toàn > Trung thực > Quyền riêng tư > Trải nghiệm > Tăng trưởng > Thẩm mỹ`

---

## 1. An toàn luôn đứng đầu
- Nút **“Cần giúp ngay”** luôn hiện rõ trên thanh đầu ở mọi màn hình (tối đa 1 chạm tới danh bạ hỗ trợ và mẫu tin nhắn cho người thân).
- Mọi ô nhập nội dung cảm xúc (Nhật ký, Thư chưa gửi, Bộc bạch, Tái khung suy nghĩ) đều tích hợp nhận diện rủi ro thời gian thực (`shared/riskDetector.ts`) hiển thị thẻ nâng đỡ bình thản — **không phán xét, không xóa nháp của người dùng**.
- Cộng đồng công khai luôn đứng sau cổng trực kiểm duyệt thật (`community_shift_state`); khi hàng đợi vượt ngưỡng (`>= 12`), hệ thống tự động thông báo chế độ chậm và khuyến nghị tạm đóng ca trực để ưu tiên xử lý các ca Mức 2–3.

## 2. Trung thực tuyệt đối
- Không hiển thị số liệu giả (không tự bịa số người đang online, không gắn lời chứng thực hay tên cố vấn/đối tác chưa có văn bản đồng ý).
- Không dùng thuật ngữ sai sự thật: nếu bản đồ/đồ thị chỉ đếm tổng hợp trên thiết bị hoặc số ngày check-in, gọi đúng tên.
- Ranh giới rõ ràng: Heali là **góc trú tạm tự chăm sóc và phản chiếu**, không phải bác sĩ hay chuyên gia trị liệu.

## 3. Quyền riêng tư từ thiết kế (Privacy-by-Design)
- Dùng ngay ẩn danh, không thu thập email hay số điện thoại.
- Nhật ký, check-in tâm trạng và thư chưa gửi mã hóa `AES-256-GCM` trên máy chủ; hỗ trợ mã PIN riêng tư (`scrypt`) và xóa vĩnh viễn khi chọn **Hoá tro (xoá hẳn)** hoặc **Xoá toàn bộ tài khoản**.
- Liên kết chia sẻ **Gửi một ngọn đèn (`/den/:token`)** chỉ chứa mã token ngẫu nhiên, tự hết hạn sau 14 ngày và có nút **Không muốn nhận** xóa sạch lời nhắn ngay lập tức.

## 4. Thiết kế không gây nghiện (Anti-Dark Patterns)
- **Không** đếm chuỗi ngày liên tiếp (`streak`), không cảnh báo mất chuỗi, không % chữa lành.
- **Không** gửi thông báo đẩy thúc ép hoặc khơi gợi nỗi buồn (ví dụ: cấm thông báo kiểu *"Hôm nay bạn quên viết nhật ký rồi"* hay *"Nhớ người cũ à?"*).
- **Không** có bảng xếp hạng lượt thích ở Tâm tình hay cây ước nguyện.
- **Luôn** cho phép người dùng xem trước chính xác nội dung trước khi chia sẻ hoặc tải ảnh PNG (Thẻ phản chiếu).
- Hỗ trợ đầy đủ chế độ nền tối dịu ban đêm (`dark`), chữ rõ ràng (`>= 16px` nội dung đọc), và chế độ nhẹ giảm chuyển động (`prefers-reduced-motion` / `heali-low-motion`).
