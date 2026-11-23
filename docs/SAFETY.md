# Giao thức An toàn & Rà soát Khủng hoảng — Heali

Tài liệu này quy định giao thức an toàn bắt buộc của Heali (Phiên bản Giai đoạn 0 — Nền móng). Khi có mâu thuẫn giữa trải nghiệm/tăng trưởng và an toàn người dùng, **an toàn người dùng luôn là ưu tiên cao nhất**.

---

## 1. Bộ phát hiện rủi ro dùng chung (`shared/riskDetector.ts`)

- Chạy thống nhất ở cả client (hiển thị thẻ hỗ trợ tức thì, không gửi nội dung ra ngoài) và server (kiểm duyệt công khai / nhật ký / thư / đặt ghế / WebSocket chat).
- Chuẩn hóa văn bản trước khi đối chiếu:
  - Đưa về chữ thường.
  - Bỏ dấu tiếng Việt.
  - Gom ký tự lặp kéo dài (vd: `cheeeet` -> `chet`).
  - Hỗ trợ teencode / viết tắt phổ biến (`ko`, `k`, `dc`, `muon chet`, `tu tu`, `tự sát`, `kết thúc cuộc đời`...).
- Giảm dương tính giả:
  - Loại trừ cụm thành ngữ vô hại (`cười chết mất`, `buồn chết đi được`, `mệt chết`, `đói chết`, `nóng chết`...).
  - Kiểm tra ngữ cảnh phủ định rõ ràng (`không muốn chết`, `chưa bao giờ nghĩ đến chuyện chết`, `không có ý định tự tử`).

### 3 Mức độ Rủi ro

| Mức | Nhận diện | Hành vi giao diện (UI) | Hành vi máy chủ (Server) |
|---|---|---|---|
| **Mức 1** (Đau khổ cao) | Tuyệt vọng, trống rỗng, kiệt sức, không thiết gì | Gợi ý dịu dàng (`SupportPromptCard` compact): thở 1 phút, viết tiếp, xem hỗ trợ. Không bật modal. | Tự bật cờ `is_trigger_warning = 1` nếu đăng ở Tâm tình. |
| **Mức 2** (Ý nghĩ thụ động) | Muốn biến mất, chán sống, mọi người sẽ tốt hơn nếu không có mình | Thẻ hỗ trợ ngay dưới ô nhập (`SupportPromptCard`): *"Bạn có đang nghĩ đến việc làm hại bản thân không?"* + nút **Cho mình xem nơi có thể gọi ngay** / **Tôi ổn, cứ để mình viết tiếp**. | **Bài Tâm tình mức ≥ 2 không hiện công khai ngay**, chuyển vào `moderation_queue` (`status = 'pending'`). Chat công khai (Phòng trà) giữ lại thông điệp để không lan truyền nội dung khủng hoảng và hiện thẻ hỗ trợ cho tác giả. Chat 1:1 gửi thông báo an toàn cho cả hai phía. |
| **Mức 3** (Ý định / kế hoạch rõ) | Đề cập phương tiện, thời điểm cụ thể (`đêm nay`, `lúc này`), lời chào từ biệt | Thẻ hỗ trợ khẩn cấp độ tương phản cao, dịu mắt: gọi **115**, mở trang **Cần giúp ngay**, gợi ý ở cạnh người thân. Vẫn có nút đóng để không tước quyền kiểm soát. | Giữ bài công khai vào `moderation_queue` với `risk_level = 3`. Không lưu chi tiết phương pháp vào nhật ký vận hành công khai. |

### Quy tắc bất di bất dịch
1. **Không bao giờ chặn gõ phím** hoặc xóa nội dung người dùng đang nhập khi phát hiện rủi ro.
2. Không lưu nhãn mức rủi ro gắn với danh tính người dùng cho mục đích phân tích hoặc quảng cáo.

---

## 2. Nút "Cần giúp ngay" & Danh bạ hỗ trợ (`/server/data/helplines.json`)

- Nút **Cần giúp ngay** luôn xuất hiện cố định ở thanh điều hướng trên mọi màn hình (kể cả trong không gian nhà 3D), chữ ≥ 16px, vùng chạm ≥ 48px, màu dịu nhưng tương phản cao, không nhấp nháy.
- Nguồn dữ liệu duy nhất nằm tại `/server/data/helplines.json` — có thể cập nhật mà không cần sửa code giao diện hay build lại frontend.
- Mỗi đầu số hiển thị rõ:
  - Tên đơn vị & số điện thoại.
  - Khung giờ hoạt động.
  - Phạm vi phục vụ (ví dụ: **111** ghi rõ phạm vi chính là bảo vệ trẻ em & thanh thiếu niên; **115** cho cấp cứu y tế khẩn cấp).
  - Trạng thái xác minh (`verified_official` vs `needs_verification`) và ngày cập nhật gần nhất (`lastUpdated`).
- Không khẳng định tuyệt đối về bảo mật, ẩn danh hay cam kết luôn có người trực của bên thứ ba.
- Tích hợp nút **"Gửi tin cho người mình tin"** hỗ trợ mở `sms:`, chia sẻ hệ thống (`navigator.share`), hoặc sao chép tin nhắn mẫu sẵn.

### Quy trình cập nhật Helpline định kỳ
1. Mỗi quý (tối thiểu 90 ngày/lần), người phụ trách gọi kiểm tra lại từng số ngoài danh mục `115` / `111`.
2. Cập nhật trường `hours`, `verificationStatus`, `verificationNote`, `lastUpdated` trong `/server/data/helplines.json`.
3. Các số chưa gọi xác minh trực tiếp **bắt buộc** giữ trạng thái `needs_verification` và hiển thị nhãn cảnh báo trên UI.

---

## 3. Quy trình xử lý hàng đợi kiểm duyệt (`moderation_queue`) & Cổng nội bộ (`/admin`)

> **Trạng thái Giai đoạn 2 — Cộng đồng có kiểm duyệt:** Cổng điều phối nội bộ `/admin` và công tắc ca trực (`/api/community/status`) đã được kích hoạt để kiểm soát cộng đồng công khai theo ca trực có người rà soát.

1. **Xác thực & Cô lập cổng điều phối (`/admin`):**
   - Giao diện `/admin` tách biệt hoàn toàn khỏi luồng điều hướng người dùng thường.
   - Bảo vệ bằng `HEALI_ADMIN_PASSCODE` từ biến môi trường máy chủ (hoặc thiết lập một lần trên DB khi chưa đặt env; mật khẩu luôn băm bằng `scrypt`, phiên điều phối chỉ lưu trong RAM trình duyệt).
2. **Tiếp nhận & Sắp xếp ưu tiên:**
   - Bài Tâm tình có `detectRisk >= 2` tự động giữ lại (`is_moderated = 1`) và vào `moderation_queue` (`status = 'pending'`).
   - Mọi báo cáo từ người dùng (Tâm tình, tin nhắn Phòng trà `lounge:report`, Chat 1:1) đều vào `moderation_queue` — **không** tự ẩn theo số lượng báo cáo để tránh bị lợi dụng tấn công.
   - Thứ tự ưu tiên bắt buộc trong hàng đợi: **Mức 3 (Khẩn cấp)** → **Mức 2 (Ý nghĩ thụ động)** → **Báo cáo từ người dùng**.
3. **Công tắc ca trực & Giới hạn mở cộng đồng (`/api/community/status`):**
   - Điều phối viên có thể bật/tạm dừng ca trực (`active` / `paused`) và cấu hình mục tiêu SLA.
   - Khi ngoài ca trực kiểm duyệt (`communityOpen = false`), API đăng bài Tâm tình công khai và bắt cặp / nhắn tin Chat Người Lạ tự động trả về `503`, hiển thị thông báo hẹn giờ quay lại và gợi ý **Không gian tự chăm sóc cá nhân**.
4. **Dấu vết kiểm toán & Chặn vi phạm:**
   - Mọi quyết định (`approve_public`, `approve_with_tw`, `hide_post`, `mark_safety_outreach`, `ban_author`, `dismiss_report`) đều thực hiện trong transaction nguyên tử, ghi nhận vào bảng `moderation_audit_logs`, và áp dụng cờ `users.is_banned` khi cần khóa tài khoản quấy rối.
5. **An toàn cho người kiểm duyệt:**
   - Nội dung Mức ≥ 2 mặc định **làm mờ (blur)** trong hàng đợi và chỉ mở xem khi chủ động bấm.
   - Có nhắc nhở nghỉ ngơi sau khi rà soát liên tục, luân phiên ca trực, không bắt buộc đọc lại chi tiết đồ họa.

---

## 4. An toàn Chat Người Lạ & Phòng Tâm Linh (Phần 4.3 & 4.4)

- **Chat người lạ & Phòng trà:**
  - Cổng xác nhận **18+ và nguyên tắc ứng xử** trước lần vào đầu tiên.
  - Làm sạch biệt danh công khai (`sanitizePublicAlias`) và chặn tin nhắn chứa số điện thoại, liên kết URL, `@handle` mạng xã hội hoặc từ khóa chuyển khoản.
  - Luôn hiện nút **Báo cáo** (có chọn lý do rõ ràng cho cả chat 1:1 và từng tin nhắn Phòng trà), **Chặn**, **Rời phòng**.
  - Nhắc an toàn định kỳ ngay trong phòng chat 1:1 (mỗi 8 tin nhắn hoặc 4 phút): có thể dừng hoặc rời phòng bất cứ lúc nào nếu thấy không thoải mái.
- **Phòng Tâm Linh (Tarot / Tử Vi / Số Học / Ghế Cố Vấn):**
  - Định vị là công cụ **gợi mở suy ngẫm & giải trí**, không phải dự đoán định mệnh hay trị liệu tâm lý; mỗi lá bài đều gắn **Câu hỏi tự vấn** để người dùng tự soi chiếu.
  - Mặc định tắt thu phí (`FEATURE_PAID_SPIRITUAL=false`), áp dụng trần phí chặt (`seatPrice ≤ 300.000đ`, `viewerTicketPrice ≤ 50.000đ`) và yêu cầu xác nhận **Quy tắc Cố vấn** (cấm chẩn đoán bệnh lý, cấm phán đoán định mệnh tiêu cực, cấm gài khách quay lại để thu phí).
  - **Bảo vệ chống lệ thuộc & quyền riêng tư:** Hỏi lại nhẹ nhàng (`409 REFLECTION_PAUSE_RECOMMENDED`) khi đặt liên tiếp trong 24 giờ hoặc đặt câu hỏi lặp về người cũ (gợi ý mở công cụ 10 phút *"Tôi sắp nhắn cho người cũ"*). Không lưu ngày sinh đối với ghế thuần Tarot và xóa ngày sinh khỏi máy chủ ngay khi bấm hoàn tất phiên (`PATCH /api/spiritual/bookings/:id/complete`).

