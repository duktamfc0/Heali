# Chỉ số Thành công Lành mạnh — Heali (Phần 8.4)

Heali đo hiệu quả dựa trên **mức độ giúp ích an toàn**, không đo dựa trên việc giữ chân người dùng bằng mọi giá.

---

## 1. Các chỉ số được phép theo dõi (Tổng hợp, ẩn danh, không gắn nội dung)

| Chỉ số | Ý nghĩa | Ghi chú thu thập |
|---|---|---|
| **Tỷ lệ hoàn thành công cụ Dịu lại** | % phiên chọn một bài thở / chạm đất / âm thanh và đi đến bước kết thúc | Chỉ đếm sự kiện tổng hợp ẩn danh |
| **Tỷ lệ mở thẻ hỗ trợ & phản hồi "Hữu ích"** | Đánh giá thẻ `SupportPromptCard` có xuất hiện đúng lúc và giúp ích không | Không ghi nội dung câu chữ đã kích hoạt thẻ |
| **Thời gian tới hành động hữu ích đầu tiên** | Từ lúc mở app đến lúc chọn xong 1 việc có ích | Không đo thời gian ở lại lâu |
| **Tỷ lệ quay lại tự nhiên sau 7 / 30 ngày** | Quay lại khi cần mà **không** dùng thông báo đẩy thúc ép | Không gửi thông báo kiểu "Bạn đã bỏ lỡ..." |
| **Giới thiệu tự nhiên (Gửi một ngọn đèn)** | Tỷ lệ người dùng mới đến từ chia sẻ ngọn đèn thân thiện | Không gắn định danh người gửi/nhận |
| **Thời gian xử lý hàng đợi kiểm duyệt** | Tỷ lệ báo cáo & bài rủi ro mức 2–3 được người trực xử lý đúng SLA | Chỉ số vận hành an toàn |
| **Điểm cảm nhận ngắn tùy chọn** | *"Hôm nay Heali có giúp bạn nhẹ hơn một chút không?"* | Cho phép bỏ qua dễ dàng |

---

## 2. Các chỉ số TUYỆT ĐỐI KHÔNG tối ưu (Phần 8.4 & Phần 11)

- ❌ Thời gian ở lại app (Time-on-app / Session duration).
- ❌ Số lần mở app mỗi ngày (DAU/Open-frequency gaming).
- ❌ Chuỗi ngày liên tiếp (Streaks) hoặc "% chữa lành".
- ❌ Số lượng bài đăng Tâm tình càng nhiều càng tốt.

---

## 3. Triển khai kỹ thuật hiện tại (Giai đoạn 3)

- **Endpoint ghi nhận (`POST /api/metrics/event`):** Chỉ nhận danh sách sự kiện cho phép (`calm_tool_completed`, `support_card_shown`, `support_card_opened`, `support_helpful_yes`, `first_useful_action`, `lantern_gift_created`, `challenge_step_done`, `feeling_lighter_yes`, `feeling_lighter_no`) và `valueMs` tùy chọn. Từ chối mọi trường văn bản hay định danh người dùng.
- **Quyền Opt-out phía trình duyệt:** Khi bật công tắc **Từ chối thống kê tổng hợp** trong `Quyền riêng tư & An toàn`, trình duyệt không gửi bất kỳ sự kiện nào lên server.
- **Bảng tổng hợp nội bộ (`GET /api/admin/metrics` & tab `Chỉ số lành mạnh (8.4)` trên `/admin`):** Tính tổng hợp 30 ngày gần nhất gồm trung vị thời gian tới hành động hữu ích đầu tiên, tỷ lệ mở/hữu ích của thẻ hỗ trợ, tỷ lệ đạt SLA hàng đợi kiểm duyệt, cảnh báo quá tải hàng đợi (`>= 12` mục chờ), và góp ý ẩn danh.
