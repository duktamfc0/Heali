# HEALI: MASTER PROMPT XÂY DỰNG TỔNG THỂ

> Dán toàn bộ nội dung này cho AI lập trình (Claude Code, Cursor, AI Studio...) cùng source code hiện tại. Prompt này thay thế bản `heali_prompt_tam_ly.md` trước đó: nó giữ toàn bộ phần an toàn tâm lý và bổ sung nền tảng kỹ thuật, bản sắc thương hiệu, truyền thông và tăng trưởng có đạo đức.

---

## PHẦN 0. SỨ MỆNH & CÁCH HIỂU SẢN PHẨM

**Heali** là một ứng dụng web (PWA) tiếng Việt, ẩn danh, làm **nơi trú tạm an toàn** cho người đang đau sau chia tay hoặc những tan vỡ trong cuộc sống. Heali giúp người dùng **gọi tên cảm xúc, xả ra một cách an toàn, dịu lại, và từng bước quay về đời thực**. Heali không điều trị, không chẩn đoán, không thay thế chuyên gia.

**Câu định vị (dùng cho mọi thứ từ UI đến truyền thông):**
> *"Một góc nhỏ yên tĩnh cho lúc lòng vỡ. Ẩn danh. Không phán xét. Không quảng cáo."*

**Ba lời hứa với người dùng** (mọi dòng code, mọi dòng chữ, mọi chiến dịch phải giữ):
1. **An toàn:** luôn có đường tới hỗ trợ khủng hoảng trong một chạm.
2. **Trung thực:** không số liệu giả, không hứa điều app không làm được.
3. **Tôn trọng:** dữ liệu riêng tư là của họ; app không bán, không khai thác nỗi đau của họ.

**Người dùng mục tiêu:** người Việt 18-35 tuổi, thường dùng điện thoại, thường mở app vào ban đêm, đang kiệt sức cảm xúc, hay nghĩ quẩn (ruminate), dễ tổn thương trước lời nói vô tình, dễ tin vào lời hứa "chắc chắn sẽ ổn". Một phần nhỏ có thể có ý nghĩ tự hại. **Làm sai ở đây không chỉ là bug, mà có thể làm một người đang yếu thêm tổn thương.**

## PHẦN 1. CÁCH LÀM VIỆC (bắt buộc)

1. **Đọc trước, sửa sau.** Rà toàn bộ repo, đối chiếu từng phát hiện ở Phần 3 với code thật. Nếu một phát hiện không còn đúng thì ghi chú và bỏ qua; nếu thấy vấn đề tương tự ở chỗ khác thì xử lý luôn.
2. **Lập kế hoạch bằng văn bản** (danh sách việc theo giai đoạn ở Phần 9) và chờ xác nhận nếu có thay đổi lớn về cấu trúc (đổi cơ sở dữ liệu, đổi điều hướng, đổi giao diện tổng thể).
3. **Từng bước nhỏ, mỗi bước có thể chạy được.** Mỗi gói việc = một nhánh/commit riêng, có mô tả "Vì sao (tâm lý/người dùng)" và "Cách kiểm tra".
4. **Không xoá tính năng đang có** nếu không nêu lý do tâm lý/an toàn rõ ràng; ưu tiên sửa, thêm lớp bảo vệ, hoặc thay thế.
5. **Khi mâu thuẫn:** an toàn người dùng > trung thực > quyền riêng tư > trải nghiệm > tăng trưởng > thẩm mỹ. Ghi rõ lựa chọn trong mô tả thay đổi.
6. **Không tự bịa dữ liệu, số liệu, trích dẫn, đối tác, chứng nhận** ở bất kỳ đâu (kể cả trang giới thiệu, dữ liệu mẫu, tài liệu truyền thông). Chỗ nào cần nội dung do con người cung cấp (chuyên gia, đối tác, số hotline đã xác minh) thì để **placeholder rõ ràng** và liệt kê trong `docs/TODO_NGUOI_THAT.md`.
7. Mọi chuỗi giao diện bằng tiếng Việt tự nhiên, theo Hướng dẫn giọng điệu (Phần 5). Tách chuỗi vào file ngôn ngữ (`src/i18n/vi.ts`) để sau này dịch được.

## PHẦN 2. NGUYÊN TẮC THIẾT KẾ (la bàn cho mọi quyết định)

1. **An toàn trước, đẹp sau.** Hỗ trợ khủng hoảng luôn ≤ 1 chạm, không bị hiệu ứng che.
2. **Trung thực tuyệt đối.** Người đang tổn thương phát hiện bị lừa sẽ mất niềm tin vĩnh viễn.
3. **Xác nhận cảm xúc, không áp đặt tiến trình.** Chữa lành không tuyến tính. Giận, tê liệt, nhớ nhung, hối hận đều hợp lệ. Không ép "buông bỏ", "tha thứ", "mừng vì bạn khá hơn".
4. **Không khuyến khích phụ thuộc.** Đích đến là giúp người dùng quay lại đời thực (bạn bè, giấc ngủ, vận động, chuyên gia khi cần). Không tối đa hoá thời gian ở lại.
5. **Giảm tải nhận thức.** Ít lựa chọn, một việc chính mỗi màn hình, chữ đủ lớn, tương phản đủ.
6. **Quyền kiểm soát thuộc về người dùng.** Họ quyết định chia sẻ gì, xoá gì, ai thấy gì; mọi thứ có thể rút lại.
7. **Không bệnh lý hoá, không chẩn đoán.** Không gán nhãn người dùng bằng từ "trầm cảm", "rối loạn".
8. **Tăng trưởng phải đến từ giá trị thật.** Không dark pattern, không khai thác nỗi đau để câu tương tác.

## PHẦN 3. HIỆN TRẠNG & CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN (xác minh lại trong code)

**Stack hiện tại:** `server.ts` (Express + `ws`, lưu JSON ở `data/heali_db.json`), `src/components/*` (7 tab: Khu vườn, Gặp gỡ, Tâm linh, Tâm tình, Nhật ký, Thư chưa gửi, Cây ước), `src/components/world/*` (thế giới 3D R3F/three), `src/services/*`, `src/data/tarotDeck.ts`. `@google/genai` và `GEMINI_API_KEY` đã khai báo nhưng **chưa dùng**.

| # | Phát hiện | Vị trí |
|---|---|---|
| 1 | Lưới an toàn khủng hoảng gần như không có: chỉ một regex 5 cụm từ chỉ để làm mờ bài đăng, người viết không nhận hỗ trợ; nhật ký/thư/chat/tâm trạng không phát hiện rủi ro; nút hỗ trợ chỉ là icon khiên nhỏ | `server.ts` ~573; `App.tsx`; `HelplineModal.tsx` |
| 2 | Số liệu giả: chuỗi ngày = `recentEntriesCount*2+1`; "tiến trình chữa lành 80%" gõ cứng; "1.612 người đang hít thở" gõ cứng | `PersonalJourneyDashboard.tsx` ~155; `CommunityPresence.tsx` :49 |
| 3 | "Đốt thư" chỉ đổi `status`, nội dung vẫn lưu trên server; thông điệp sau nghi thức mang tính kết luận | `server.ts` ~909-930; `UnsentLettersView.tsx` |
| 4 | PIN lưu plaintext, trả về client, so sánh phía client; route `/api/private/*` không kiểm tra PIN; token sinh bằng `Math.random()`; nhật ký/thư plaintext; `data/heali_db.json` nằm trong mã nguồn; mất thiết bị = mất hết dữ liệu | `server.ts` ~473-530, 810-950; `JournalView.tsx` ~91 |
| 5 | Giọng điệu tích cực độc hại/giả định; app tự xưng "Tôi thấu hiểu" | `PersonalJourneyDashboard.tsx` ~28-32; thông điệp đốt thư |
| 6 | Chấm tâm trạng 1-5 thiếu giận/lo âu/tê liệt/tội lỗi/nhớ nhung và tự tạo bài nhật ký soạn sẵn | `PersonalJourneyDashboard.tsx` ~50-66 |
| 7 | Phòng tâm linh: nhãn "Tarot Chữa Lành" ngầm khẳng định tác dụng trị liệu; nội dung có câu khẳng định chắc chắn; trần giá 5.000.000đ; thu ngày sinh | `SpiritualRoomView.tsx`; `TarotHostWorkspace.tsx`; `tarotDeck.ts`; `server.ts` ~1767 |
| 8 | Chat người lạ chưa có cổng 18+, chặn trao đổi liên hệ, phát hiện rủi ro; chưa xác nhận có nút báo cáo | `StrangerChatView.tsx`; `server.ts` ~1953-2300 |
| 9 | Quá tải: 7 tab + trang chủ nhồi 3D/thời tiết/âm thanh/dashboard; 4 tab riêng tư nhất nằm trong khối tím đậm `#111226` tách khỏi theme ấm; nhiều `text-xs`/`text-[10px]`, placeholder rất mờ | `App.tsx`; các view |
| 10 | Lưu trữ file JSON không chịu được tăng người dùng, không có sao lưu, kiểm soát đồng thời, migrate | `server.ts` |

## PHẦN 4. GIAO THỨC AN TOÀN (không thương lượng)

### 4.1 Bộ phát hiện rủi ro dùng chung
- Tạo `shared/riskDetector.ts` (dùng cả client và server). Chuẩn hoá văn bản (chữ thường, **bỏ dấu tiếng Việt**, gom ký tự lặp, hiểu teencode/viết tắt: "ko", "k", "muon chet"...).
- **3 mức:** *Mức 3* ý định/kế hoạch rõ (phương tiện, thời điểm, "đêm nay"); *Mức 2* ý nghĩ thụ động ("không muốn sống nữa", "biến mất", "mọi người sẽ tốt hơn nếu không có tôi"); *Mức 1* đau khổ cao (tuyệt vọng, trống rỗng, kiệt sức).
- **Tránh dương tính giả** với thành ngữ ("buồn chết đi được", "cười chết mất", "mệt chết"): dựa vào ngữ cảnh/cụm từ, không dựa từ đơn. Bộ test ≥ 60 câu (có dấu, không dấu, teencode, thành ngữ vô hại, câu phủ định).
- **Hành vi theo mức** (UI nhẹ nhàng, không báo động đỏ, **không chặn việc viết, không xoá chữ người dùng đã gõ**):
  - Mức 1: gợi ý dịu dàng (thở, viết tiếp, nói chuyện với ai đó), không bật modal.
  - Mức 2: thẻ hỗ trợ ngay dưới ô nhập, câu hỏi mở "Bạn có đang nghĩ đến việc làm hại bản thân không?" + `Cho mình xem nơi có thể gọi ngay` / `Tôi ổn, cứ để mình viết tiếp`.
  - Mức 3: màn hỗ trợ khẩn cấp (số gọi, gợi ý ở cạnh người thân, số cấp cứu y tế), vẫn cho phép đóng và tiếp tục.
- Áp dụng ở: tâm sự, nhật ký, thư chưa gửi, chat người lạ/lounge (người gửi nhận thẻ hỗ trợ; người nhận thấy gợi ý nhẹ), đặt lịch tâm linh, và khi chọn tâm trạng thấp nhất.
- Bài cộng đồng mức ≥ 2 **không hiện công khai ngay**: giữ chờ rà soát, tác giả nhận thẻ hỗ trợ. Không đăng chi tiết phương pháp (an toàn thông điệp).
- Không lưu nhãn mức rủi ro gắn với danh tính ngoài mức cần cho hiển thị an toàn; không dùng cho phân tích/quảng cáo.

### 4.2 Nút & trang "Cần giúp ngay"
- Hiện rõ ở **mọi màn hình** (kể cả tab nền tối và trong nhà 3D), chữ ≥ 16px, vùng chạm ≥ 48px, màu dịu nhưng tương phản cao, không nhấp nháy.
- **Xác minh lại mọi số điện thoại, khung giờ, đối tượng phục vụ** trước khi phát hành (ví dụ `111` là tổng đài bảo vệ **trẻ em**, ghi rõ phạm vi). Thêm số cấp cứu y tế. Mỗi dòng có "Cập nhật lần cuối". Không xác minh được thì ghi rõ chưa xác minh và để placeholder.
- Không khẳng định tuyệt đối về bảo mật/ẩn danh/luôn có người nghe máy của dịch vụ bên thứ ba.
- Có lựa chọn "Gửi tin cho người mình tin" (mẫu tin nhắn sẵn qua `sms:`/chia sẻ hệ thống).
- Dữ liệu helpline ở một nguồn duy nhất, cập nhật không cần build lại. Tài liệu `docs/SAFETY.md` mô tả giao thức và quy trình cập nhật.

### 4.3 Chat người lạ & cộng đồng
- Cổng **18+** và đồng ý nguyên tắc ứng xử trước lần chat đầu.
- Phát hiện và che/cảnh báo số điện thoại, link, handle mạng xã hội, từ khoá chuyển tiền trong chat.
- Nút **Báo cáo** và **Rời phòng ngay** luôn hiện; báo cáo đi vào hàng đợi rà soát thật (Phần 6.5). Banner an toàn đầu phòng, nhắc lại định kỳ "Bạn có thể dừng bất cứ lúc nào".
- Nickname/avatar không mang tính định danh hoặc gợi dục. Không có tính năng ghép đôi lãng mạn.
- Cộng đồng "Tâm tình": **giữ nguyên cơ chế chỉ có phản ứng, không có bình luận**; tự bật cảnh báo nhạy cảm theo `riskDetector`; thay "tự ẩn sau 3 báo cáo" bằng hàng chờ rà soát (tránh tấn công hàng loạt); không bảng xếp hạng/"bài hot"; quy tắc cộng đồng ngắn ở bài đăng đầu tiên.

### 4.4 Phòng Tâm linh/Tarot
- Định vị lại là **công cụ phản chiếu, không phải dự đoán**. Bỏ nhãn "Chữa Lành" gắn với tarot; viết lại các câu khẳng định chắc chắn trong `tarotDeck.ts` thành dạng mở, mỗi lá kèm một **câu hỏi tự vấn**.
- Tuyên bố miễn trừ ngắn, rõ tại nơi đặt chỗ: giải trí/phản chiếu, không thay thế tư vấn tâm lý, y tế, pháp lý, tài chính.
- **Bảo vệ tài chính:** hạ trần giá, hiện tổng tiền trước khi xác nhận, bước "đợi 24 giờ" với đơn lớn hoặc đặt lặp lại, cảnh báo khi một người liên tục hỏi cùng một câu về người cũ.
- Quy tắc cho host: cấm tuyên bố chữa bệnh, dự đoán tử vong/bệnh tật, "giải nghiệp" có thu phí thêm, thúc ép nhắn/quay lại người cũ.
- `birthDate` chỉ thu khi thật cần, giải thích mục đích, xoá khi buổi xem kết thúc.
- **Đề xuất:** vì đây là nơi có rủi ro tài chính cao nhất, đặt tính năng trả phí sau cờ `FEATURE_PAID_SPIRITUAL=false` mặc định, chỉ bật sau khi có cơ chế thanh toán, quy tắc host và rà soát pháp lý.

## PHẦN 5. HƯỚNG DẪN GIỌNG ĐIỆU (áp dụng cho toàn bộ copy)

**Nên:** phản chiếu điều người dùng đã nói; "bạn" ngang hàng; câu ngắn; mở cửa thay vì kết luận ("Nếu bạn muốn...", "Có thể...").

**Tránh:** tích cực độc hại ("Cơn mưa nào rồi cũng tạnh"); giả định trạng thái ("Bạn đã kiên trì thức dậy mỗi ngày", "Cảm ơn bạn vì đã dũng cảm buông tay"); app tự xưng thấu cảm như người thật ("Tôi thấu hiểu cơn đau của bạn"); lời khuyên không ai hỏi; thúc ép tha thứ; hứa tương lai ("phía trước chắc chắn là mặt hồ yên ả").

**Ví dụ viết lại:**
- Chọn tâm trạng thấp nhất: *"Hôm nay đang rất nặng. Bạn không cần làm gì cả. Nếu muốn, mình có vài việc nhỏ có thể giúp qua đoạn này."* + `Thở cùng mình 1 phút` · `Viết ra một chút` · `Tôi cần nói chuyện với ai đó`.
- Sau khi huỷ lá thư: *"Lá thư đã không còn lưu ở đây. Bạn không cần thấy nhẹ nhõm ngay. Có thể cần thêm thời gian, và như vậy cũng ổn."*
- Quay lại sau vắng mặt: *"Chào mừng bạn quay lại. Không có gì phải bù cả."*

## PHẦN 6. NỀN TẢNG KỸ THUẬT CHUYÊN NGHIỆP

### 6.1 Dữ liệu & kiến trúc
- Thay file JSON bằng **cơ sở dữ liệu thật** (khuyến nghị PostgreSQL; nếu muốn đơn giản giai đoạn đầu thì SQLite + lớp truy cập tách biệt để đổi được), có migration, ràng buộc, chỉ mục, sao lưu tự động. Dữ liệu cũ trong `data/heali_db.json` chỉ là dữ liệu thử: viết script migrate nhưng **xoá khỏi repo** và thêm `data/` vào `.gitignore`.
- Tách `server.ts` (~2.300 dòng) thành module: `auth`, `confessions`, `journal`, `letters`, `lanterns`, `wishes`, `chat`, `spiritual`, `music`, `moderation`, `safety`. Validate đầu vào bằng schema (ví dụ zod) ở mọi route và tin nhắn WebSocket.
- Chuỗi chat/lounge dùng WebSocket có giới hạn kết nối, kích thước tin, tốc độ; thiết kế để sau này mở rộng ngang (adapter pub/sub) nhưng đừng làm quá sớm.
- Module nhạc dùng nguồn bên thứ ba (SoundCloud/Audius qua scraping/proxy): **rà soát điều khoản & bản quyền**, thêm fallback ưu tiên nhạc có giấy phép rõ ràng, xử lý lỗi êm, không để hỏng cả trang nếu nguồn ngoài hỏng.

### 6.2 Quyền riêng tư & bảo mật
- Token bằng `crypto.randomBytes(32)`, hạn dùng, có thể thu hồi. Thêm **mã khôi phục tuỳ chọn** và **xuất dữ liệu** (file) để mất thiết bị không đồng nghĩa mất hết nhật ký.
- PIN: băm (scrypt/argon2) ở server, **không bao giờ trả PIN/hash về client**, xác thực qua endpoint riêng cấp phiên mở khoá có thời hạn, giới hạn số lần thử; `/api/private/*` yêu cầu phiên mở khoá khi PIN bật.
- Nhật ký/thư **mã hoá khi lưu** (tối thiểu mã hoá phía server bằng khoá từ biến môi trường; lý tưởng mã hoá phía client với khoá dẫn xuất từ PIN, nói rõ đánh đổi: quên PIN = mất dữ liệu).
- **"Hoá tro" phải xoá thật** (ghi đè/xoá bản ghi, không khôi phục được) và nói rõ trước khi xác nhận. Thêm lựa chọn `Niêm phong đến ngày…` (tự mở lại sau 30/60/90 ngày để đọc lại). Thay `confirm()` của trình duyệt bằng hộp thoại dịu của app; xoá nhật ký có hoàn tác ~10 giây.
- Bảo mật cơ bản: `helmet`, CORS chặt, rate limit theo IP/token, giới hạn kích thước body, không log nội dung người dùng, bí mật chỉ ở biến môi trường, `.env.example` cập nhật.
- **Trang Quyền riêng tư dễ hiểu** (không phải điều khoản pháp lý dài): dữ liệu nào lưu ở đâu, ai thấy được, cách xoá toàn bộ tài khoản (xoá thật, có hiệu lực ngay). Soạn Điều khoản/Chính sách bảo mật dạng nháp theo quy định bảo vệ dữ liệu cá nhân hiện hành của Việt Nam và ghi rõ **cần luật sư xác nhận trước khi phát hành** (dữ liệu về cảm xúc/sức khoẻ tinh thần là loại nhạy cảm).
- **Phân tích dữ liệu tôn trọng riêng tư:** không dùng tracker quảng cáo bên thứ ba; chỉ đếm sự kiện tổng hợp, không bao giờ ghi nội dung; nêu rõ trong trang Quyền riêng tư; có thể tắt.

### 6.3 Hiệu năng & thiết bị
- Mục tiêu: dùng tốt trên điện thoại tầm trung, mạng 3G/4G yếu, pin hạn chế.
- Thế giới 3D **tải lười** (chỉ tải khi mở), có **chế độ nhẹ** tự bật khi máy yếu/tiết kiệm pin/`prefers-reduced-motion`; kiểm tra kích thước asset (`public/assets/3d`, `tarot`, `audio`), nén ảnh (đã có `sharp`), cắt các file thừa như thư mục `public/assets/aistudio` và `.aistudio/` nếu không dùng.
- PWA: offline cho **bản nháp nhật ký/thư** (lưu cục bộ rồi đồng bộ), trang offline dịu nhẹ, cập nhật phiên bản không làm mất bản nháp.
- Ngân sách: LCP < 2,5s trên 4G giả lập ở trang chính (không tính 3D), Lighthouse Performance/Accessibility ≥ 90 trên các trang chính.

### 6.4 Khả năng tiếp cận
- Cỡ chữ nền ≥ 16px cho nội dung chính; tương phản đạt WCAG AA; vùng chạm ≥ 44px; hỗ trợ bàn phím/đọc màn hình (nhãn ARIA, thứ tự tab); tôn trọng `prefers-reduced-motion` (đóng băng thời tiết, đom đóm, hiệu ứng đốt thư có phiên bản tĩnh); không chỉ dựa vào màu để truyền thông tin.

### 6.5 Vận hành kiểm duyệt (bắt buộc trước khi mở cộng đồng)
- **Trang quản trị nội bộ** (đăng nhập riêng, không nằm chung với app người dùng): hàng đợi bài chờ rà soát (mức rủi ro, báo cáo), hành động (duyệt/gỡ/liên hệ hỗ trợ), nhật ký hành động. Quy trình xử lý nội dung mức 2-3 được viết thành văn bản trong `docs/SAFETY.md` để con người thực hiện.
- Kiểm tra: không có hàng đợi và người trực thì **không bật** chat người lạ và đăng bài công khai.

### 6.6 Chất lượng & triển khai
- Test: đơn vị (riskDetector, tính toán thống kê thật), tích hợp (API riêng tư/PIN/xoá thư), E2E (Playwright) cho luồng chính: vào app → chọn nhu cầu → viết nhật ký → thấy thẻ hỗ trợ khi gõ câu mức 2 → huỷ thư → xoá dữ liệu.
- CI (lint `tsc`, test, build), kiểm tra bí mật bị lộ, quét phụ thuộc. Giám sát lỗi **không chứa nội dung/PII**. Sao lưu và kế hoạch khôi phục có kiểm thử.
- Tách môi trường dev/staging/production; không dùng dữ liệu thật ở dev.

## PHẦN 7. TRẢI NGHIỆM SẢN PHẨM (nhân văn, giảm tải)

### 7.1 Onboarding & điều hướng
- **Màn chào 3 bước, bỏ qua được:** (1) lời chào + 3 lời hứa; (2) "Hôm nay bạn cần gì?" → `Xả ra` (viết/thư) · `Dịu lại` (thở/âm thanh) · `Có ai đó bên cạnh` (cộng đồng) · `Chỉ muốn yên lặng`; (3) giới thiệu nút "Cần giúp ngay" và riêng tư. Lựa chọn dùng để **làm nổi bật 1-2 việc** trên trang chính, không ẩn phần còn lại.
- Đơn giản hoá điều hướng thành 4 nhóm: **Cho riêng mình** (Nhật ký, Thư chưa gửi, Cây ước) · **Dịu lại** (thở, âm thanh, công cụ tự điều chỉnh) · **Cùng người khác** (Tâm tình, Gặp gỡ) · **Khám phá** (Tâm linh, khu vườn 3D). Phòng Tâm linh không nằm đầu luồng người mới.
- **Thống nhất theme ấm** (be/xanh rêu); bỏ khối tím đậm làm mặc định cho các tab riêng tư; chế độ tối là lựa chọn của người dùng. Giữ bản sắc: font serif, lá, hồ trăng, đom đóm.

### 7.2 Tính năng cốt lõi (hoàn thiện)
- **Check-in tâm trạng có chiều sâu:** chọn nhiều cảm xúc từ bánh xe cảm xúc tiếng Việt (có định nghĩa ngắn, gồm giận, lo âu, tê liệt, tội lỗi, nhớ nhung); lưu thành loại dữ liệu riêng, **không tự tạo bài nhật ký**; biểu đồ tuần/tháng **thật** trong Nhật ký (xu hướng, không điểm số phán xét).
- **Nhật ký viết có hướng dẫn, chống nghĩ quẩn:** (1) chuyện đã xảy ra → (2) cơ thể/cảm xúc đang thế nào → (3) mình cần gì lúc này → (4) một việc nhỏ tử tế với bản thân. Đề xuất giới hạn 15-20 phút, **bước hạ nhiệt cuối buổi** (thở 1 phút / nói tên 5 vật nhìn thấy). Viết sau nửa đêm: gợi ý "viết ra rồi nghỉ, hay nghe âm thanh để ngủ?". Giữ ô biết ơn/tự chăm sóc nhưng cho phép bỏ qua.
- **Thư chưa gửi:** hai lựa chọn kết thúc `Hoá tro (xoá hẳn)` / `Niêm phong đến ngày…`; thông điệp trung tính theo Phần 5.
- **Luồng "Tôi sắp nhắn cho người cũ":** nút nhanh cho khoảnh khắc thôi thúc lúc 2 giờ sáng → đếm ngược dịu 10 phút → "Bạn muốn điều gì từ tin nhắn này?" → gợi ý viết thành thư chưa gửi → kết bằng thở/âm thanh. Không phán xét, không cấm đoán. *(Đây là tính năng đặc thù có giá trị cao và cũng là điểm truyền thông tốt.)*
- **Tab "Dịu lại":** thở chậm (nối với `AudioPlayerDrawer`), chạm đất 5-4-3-2-1, từ bi với bản thân (3 câu), tái khung suy nghĩ rất nhẹ ("bằng chứng cho/ngược lại"). Mỗi công cụ ≤ 3 phút, không cần đăng nhập, có chế độ chỉ âm thanh.
- **Ngày khó khăn:** người dùng tự đặt vài ngày (kỷ niệm, sinh nhật người cũ); nhắn dịu **chỉ khi họ bật**, không thông báo thúc giục.
- **"Quay về đời thực":** sau 2-3 tuần, thẻ nhẹ gợi ý kể với một người tin tưởng và thông tin tìm chuyên gia khi nỗi đau kéo dài ảnh hưởng ăn ngủ/làm việc/học tập. Chỉ thêm bảng tự đánh giá nếu có bản tiếng Việt đã kiểm chứng; luôn ghi "không phải chẩn đoán".
- **Thống kê hiện diện thật:** chỉ hiện số người đang hiện diện nếu lấy từ dữ liệu thật (làm tròn, ẩn khi quá ít). Gỡ "chuỗi ngày" và "% chữa lành"; thay bằng dòng không trừng phạt dựa trên dữ liệu thật ("Tuần này bạn đã dành 3 lần cho bản thân").

### 7.3 Người đồng hành AI (tuỳ chọn, làm cuối, chỉ sau khi Phần 4.1 xong)
- Gọi Gemini **chỉ từ server**; **đồng ý rõ ràng** trước khi gửi bất kỳ nội dung nhật ký nào cho bên thứ ba; có thể tắt hẳn.
- Phạm vi: *phản chiếu* (tóm tắt và đặt 1-2 câu hỏi mở). Không chẩn đoán, không khuyên bỏ/quay lại người cũ, không dự đoán, không đóng vai người đã mất/người cũ, không tự xưng chuyên gia trị liệu, không khuyến khích gắn bó cảm xúc với AI.
- Chạy `riskDetector` **trước và sau** khi gọi mô hình; mức ≥ 2 thì bỏ phản hồi AI, chuyển sang thẻ hỗ trợ. Nhắc rõ đây là AI; giới hạn số lượt/ngày; thiết kế để kết thúc hội thoại êm dịu.

## PHẦN 8. THƯƠNG HIỆU, TRUYỀN THÔNG & TĂNG TRƯỞNG CÓ ĐẠO ĐỨC

> Mục tiêu: để Heali **dễ được kể lại, dễ được tin, dễ được chia sẻ**, mà không khai thác nỗi đau của người dùng.

### 8.1 Bản sắc & trang giới thiệu
- Xây **trang đích công khai** (tách khỏi app, tải nhanh, SEO tốt) gồm: hero với câu định vị; ba lời hứa; "Heali làm gì / không làm gì" (không phải trị liệu, không thay chuyên gia); các tính năng tiêu biểu (thả hoa đăng, thư chưa gửi, dịu lại); trang Quyền riêng tư; trang An toàn & nơi nhận hỗ trợ; câu hỏi thường gặp; liên hệ.
- Mục "Cố vấn chuyên môn" và "Đối tác" chỉ hiện khi có người thật đồng ý (placeholder trong `docs/TODO_NGUOI_THAT.md`). **Không bịa tên, chức danh, logo, số liệu, lời chứng thực.**
- Bộ nhận diện: logo, bảng màu, font, quy tắc dùng hình; **ảnh chia sẻ (Open Graph/Twitter card)** đẹp cho từng trang; `manifest`, icon PWA đã có thì kiểm tra lại; tên miền, metadata, `sitemap.xml`, `robots.txt`, dữ liệu có cấu trúc.
- Nội dung blog/kiến thức ngắn (SEO, viết cùng chuyên gia): "Vì sao bạn nghĩ đến người cũ lúc 2 giờ sáng", "Viết thư không gửi hoạt động thế nào", "Làm gì khi muốn nhắn cho người cũ", "Cách ở bên người bạn đang buồn". Mỗi bài có nguồn, có mục nơi nhận hỗ trợ, không mô tả phương pháp tự hại.

### 8.2 Tính năng tự lan truyền (an toàn, không lộ dữ liệu riêng tư)
1. **"Gửi một ngọn đèn cho người bạn đang buồn":** tạo link hoa đăng ẩn danh kèm lời nhắn ("Mình đang nghĩ đến bạn"). Người nhận mở ra thấy khoảnh khắc dịu dàng, **không cần đăng ký**, được mời thả đèn đáp lại hoặc dùng thử app. Người gửi chọn có hiện tên hay không. Link không chứa nội dung riêng tư của người gửi; hết hạn sau N ngày; có giới hạn tần suất chống spam; có nút "Không muốn nhận". Đây là vòng lan truyền chính.
2. **Đêm Hoa Đăng cộng đồng:** vào dịp dễ cô đơn (14/2, 11/11, trước Tết, rằm hằng tháng) cả cộng đồng thả hoa đăng lên một mặt hồ chung vào giờ cố định; có đồng hồ đếm ngược và trang sự kiện công khai (không lộ nội dung riêng tư).
3. **Thẻ phản chiếu mỗi ngày:** một lá bài + một câu hỏi tự vấn, thiết kế đẹp để lưu/đăng story. Người dùng **tự chọn chia sẻ**; ảnh chia sẻ không chứa dữ liệu cá nhân. Định vị là công cụ phản chiếu, không dự đoán.
4. **Thử thách "7 đêm tử tế với mình":** mỗi đêm một việc nhỏ (viết một lá thư chưa gửi, thở 1 phút, kể với một người bạn...). Không chuỗi trừng phạt; bỏ lỡ không bị phạt; hoàn thành được nhận một lời nhắn dịu, không huy hiệu cạnh tranh.
5. **Chia sẻ có kiểm soát:** mọi nút chia sẻ hỏi rõ "Bạn muốn chia sẻ gì?" và xem trước. Không bao giờ tự đăng nội dung người dùng.

### 8.3 Nguyên tắc truyền thông (bắt buộc)
- Thông điệp dựa trên **kiến thức và sự ấm áp**, không dựa trên bi kịch, không câu tương tác bằng nỗi đau ("bạn có đang khóc lúc này không?"), không hứa "chữa khỏi".
- **Không đăng lời kể của người dùng** khi chưa có đồng ý rõ ràng, riêng từng lần, có thể rút lại. Mọi câu chuyện minh hoạ phải do người thật tự nguyện hoặc là nhân vật hư cấu **được ghi rõ là hư cấu**.
- Khi nói về tự hại: tuân thủ nguyên tắc an toàn thông điệp (không mô tả phương pháp/địa điểm, không giật gân, luôn kèm nơi nhận hỗ trợ đã xác minh).
- Không nhắm quảng cáo dựa trên nội dung nhật ký/tâm sự; không mua dữ liệu; không dùng nội dung riêng tư để huấn luyện mô hình.
- **Bộ tài liệu truyền thông** trong `docs/marketing/`: thông điệp chính và giọng điệu, bộ câu hỏi-trả lời cho báo chí, bản mô tả 1 trang cho đối tác, kịch bản video ngắn dựa trên **tính năng thật** (khu vườn, đốt thư, đèn hoa đăng, thở, âm thanh ngủ), danh sách kênh phù hợp (video ngắn, Threads, nhóm Facebook tâm sự, podcast đêm khuya, người làm nội dung tâm lý quy mô nhỏ), lịch nội dung theo dịp.
- **Đối tác & uy tín thật:** đường dây hỗ trợ, phòng tư vấn trường đại học, CLB tâm lý sinh viên, chuyên gia cố vấn. Chỉ ghi vào sản phẩm khi đã có xác nhận bằng văn bản.
- **Báo cáo cộng đồng theo quý** (tổng hợp, ẩn danh hoàn toàn, có ngưỡng tối thiểu để chống định danh, **chỉ khi người dùng đã đồng ý** cho phép dùng dữ liệu tổng hợp).
- **Người lắng nghe tình nguyện:** chỉ xây khi có chuyên gia thiết kế đào tạo và giám sát; không làm trong giai đoạn đầu.

### 8.4 Chỉ số thành công (lành mạnh, không phải "thời gian ở lại")
- **Dùng để quyết định:** tỷ lệ người dùng hoàn thành ít nhất một công cụ "dịu lại"; tỷ lệ mở thẻ hỗ trợ khi hiện (và phản hồi "hữu ích"); thời gian từ khi mở app đến khi làm được một việc có ích; tỷ lệ quay lại sau 7/30 ngày **không do thông báo thúc**; mức tăng trưởng đến từ giới thiệu bạn bè (ngọn đèn); tỷ lệ báo cáo được xử lý trong thời hạn; điểm hài lòng ngắn tuỳ chọn ("Hôm nay Heali có giúp bạn nhẹ hơn một chút không?").
- **Không tối ưu:** thời gian ở lại app, số lần mở/ngày, số bài đăng, chuỗi ngày.
- Mọi số đo đều tổng hợp, không gắn nội dung; hiển thị trên bảng điều khiển nội bộ.

### 8.5 Bền vững tài chính (nguyên tắc)
- **Không quảng cáo, không bán dữ liệu.** Hướng nguồn thu tương thích: ủng hộ tự nguyện, quỹ/tài trợ phi lợi nhuận, hợp tác tổ chức (trường học, doanh nghiệp quan tâm sức khoẻ tinh thần nhân viên) **mà không truy cập dữ liệu cá nhân của người dùng**.
- Mọi khoản thu phải minh bạch trong trang Quyền riêng tư/Giới thiệu. Tính năng trả phí ở phòng Tâm linh xem Phần 4.4.

## PHẦN 9. LỘ TRÌNH & CỔNG KIỂM SOÁT

Không chuyển giai đoạn khi chưa đạt toàn bộ tiêu chí của giai đoạn trước.

**Giai đoạn 0, Nền móng (bắt buộc đầu tiên)**
- Phần 4.1, 4.2 (an toàn), gỡ số liệu giả, "hoá tro" xoá thật, PIN/token/mã hoá, chuyển cơ sở dữ liệu, tách module, test cơ bản, `.gitignore` dữ liệu.
- *Cổng:* checklist Phần 10 mục A-C đạt; bộ test riskDetector đạt.

**Giai đoạn 1, Trải nghiệm an toàn (thử nghiệm kín)**
- Onboarding, điều hướng gọn, theme thống nhất, check-in cảm xúc, nhật ký có hướng dẫn, thư niêm phong, tab "Dịu lại", luồng "sắp nhắn cho người cũ", trang Quyền riêng tư/An toàn, khả năng tiếp cận, hiệu năng, PWA offline.
- Thử nghiệm kín với nhóm nhỏ (có thông báo rõ đây là bản thử, có kênh phản hồi). **Chưa bật** chat người lạ và đăng bài công khai nếu chưa có Phần 6.5.
- *Cổng:* chuyên gia tâm lý thật rà soát copy, giao thức khủng hoảng và danh sách hotline; Lighthouse đạt; không còn lỗi nghiêm trọng.

**Giai đoạn 2, Cộng đồng có kiểm duyệt**
- Trang quản trị + hàng đợi + người trực; bật Tâm tình (đã có `riskDetector`), chat người lạ có cổng 18+, chặn liên hệ, báo cáo; phòng Tâm linh theo Phần 4.4 (trả phí vẫn tắt nếu chưa đủ điều kiện).
- *Cổng:* quy trình xử lý nội dung mức 2-3 đã diễn tập; thời gian phản hồi báo cáo đạt mục tiêu đặt ra.

**Giai đoạn 3, Truyền thông & tăng trưởng**
- Trang đích + SEO + ảnh chia sẻ; "Gửi một ngọn đèn"; thẻ phản chiếu hằng ngày; thử thách 7 đêm; Đêm Hoa Đăng; bộ tài liệu truyền thông; quan hệ đối tác thật.
- Ra mắt công khai theo đợt nhỏ, theo dõi chỉ số Phần 8.4 và hạ tốc độ nếu hàng đợi kiểm duyệt quá tải.
- *Cổng:* hạ tầng chịu được tải thử; sao lưu/khôi phục đã kiểm thử; đã có người thật chịu trách nhiệm trực hỗ trợ.

**Giai đoạn 4, Mở rộng (tuỳ chọn)**
- Người đồng hành AI có rào chắn (Phần 7.3), nhạc có giấy phép rõ ràng, hợp tác tổ chức, báo cáo cộng đồng theo quý, đa ngôn ngữ.

## PHẦN 10. CHECKLIST NGHIỆM THU

**A. An toàn**
- [ ] Gõ "tôi không muốn sống nữa" và "toi muon bien mat" ở nhật ký, thư, tâm tình, chat, đặt lịch → luôn có thẻ hỗ trợ, không mất chữ đã gõ.
- [ ] "Cười chết mất", "buồn chết đi được" không kích hoạt cảnh báo.
- [ ] Bài tâm tình mức rủi ro cao không hiện công khai ngay; tác giả thấy thẻ hỗ trợ.
- [ ] Nút "Cần giúp ngay" nhìn thấy và chạm được ở mọi màn hình, kể cả trong nhà 3D.
- [ ] Tất cả số hotline đã được xác minh hoặc ghi rõ "chưa xác minh"; không dòng nào khẳng định quá mức.

**B. Trung thực**
- [ ] Không còn số liệu/trạng thái giả (tìm `1.612`, `80%`, công thức chuỗi ngày, số người xem/"ripples" bịa).
- [ ] Sau "hoá tro", tìm trong cơ sở dữ liệu và bản sao lưu gần nhất theo chính sách: không còn nội dung thư.
- [ ] Không còn nội dung hư cấu trình bày như thật (đối tác, chuyên gia, lời chứng thực).

**C. Riêng tư & bảo mật**
- [ ] PIN/hash không xuất hiện trong bất kỳ phản hồi API nào; gọi trực tiếp `/api/private/*` khi chưa mở khoá bị từ chối.
- [ ] Token do `crypto` sinh; nhật ký/thư mã hoá khi lưu; có xuất dữ liệu và xoá tài khoản hoạt động.
- [ ] Không log nội dung người dùng; không tracker quảng cáo; `data/` không còn trong repo.

**D. Trải nghiệm**
- [ ] Lần đầu mở app: onboarding ≤ 3 bước, bỏ qua được; trang chính nổi bật 1-2 việc phù hợp lựa chọn.
- [ ] Reduced-motion và máy yếu dùng được; chữ đọc được ở 100% thu phóng; điều hướng bằng bàn phím được.
- [ ] Mọi copy mới đối chiếu với Phần 5 (không tích cực độc hại, không giả định, không hứa chắc).

**E. Truyền thông & tăng trưởng**
- [ ] Trang đích có metadata, ảnh chia sẻ, trang Quyền riêng tư/An toàn; không tên/logo/số liệu bịa.
- [ ] "Gửi một ngọn đèn": link không chứa dữ liệu riêng tư, có hết hạn, giới hạn tần suất, nút từ chối nhận.
- [ ] Mọi nút chia sẻ có xem trước; không tự đăng nội dung người dùng.
- [ ] Bộ tài liệu `docs/marketing/` và `docs/TODO_NGUOI_THAT.md` đã có.

**F. Kỹ thuật**
- [ ] `npm run lint`, test, build đều qua; E2E luồng chính chạy được; CI chạy xanh.
- [ ] Sao lưu/khôi phục đã thử; Lighthouse Performance/Accessibility ≥ 90 trên trang chính.

## PHẦN 11. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

- Không bảng xếp hạng, huy hiệu cạnh tranh, chuỗi ngày trừng phạt, thông báo đẩy kiểu "Bạn đã bỏ lỡ…".
- Không đo/hiển thị "phần trăm chữa lành" hay chấm điểm tiến bộ cảm xúc như thành tích.
- Không công khai bất kỳ nội dung riêng tư nào; không dùng nhật ký/thư để quảng cáo hay huấn luyện mô hình.
- Không ngôn ngữ chẩn đoán; không khuyên dùng/ngưng thuốc.
- Không chặn người dùng khi họ chạm chủ đề tự hại; không tắt khả năng viết; không xoá chữ họ đã nhập.
- Không hứa bảo mật tuyệt đối cho dịch vụ bên thứ ba.
- Không ghép đôi lãng mạn, không gợi ý "hẹn hò ngay".
- Không bịa đối tác, chuyên gia, số liệu, lời chứng thực ở bất cứ đâu.
- Không đẩy quảng bá công khai trước khi qua cổng của giai đoạn 2.

## PHẦN 12. ĐẦU RA MONG ĐỢI

1. Kế hoạch bằng văn bản + danh sách file sẽ đụng tới (chờ xác nhận nếu đổi cấu trúc lớn).
2. Code theo từng giai đoạn, mỗi gói việc một commit/nhánh với mô tả "Vì sao" và "Cách kiểm tra".
3. Tài liệu: `docs/DESIGN_PRINCIPLES.md` (Phần 2, 5, 11), `docs/SAFETY.md` (Phần 4 + quy trình rà soát), `docs/PRIVACY.md`, `docs/marketing/*`, `docs/TODO_NGUOI_THAT.md` (mọi thứ cần con người cung cấp), `docs/METRICS.md` (Phần 8.4).
4. Báo cáo cuối mỗi giai đoạn: đã làm gì, chưa làm gì, rủi ro còn lại, và việc cần con người quyết định.

Nếu có mâu thuẫn giữa yêu cầu kỹ thuật/tăng trưởng và an toàn, trung thực hay riêng tư của người dùng, **luôn chọn an toàn, trung thực và riêng tư**, và nêu rõ trong mô tả thay đổi.
