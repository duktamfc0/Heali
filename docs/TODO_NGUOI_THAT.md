# Danh sách Việc Cần Con Người Thật Thực Hiện (`docs/TODO_NGUOI_THAT.md`)

Heali tuyệt đối **không tự bịa** số liệu, chuyên gia, đối tác, lời chứng thực hay thông tin liên hệ chưa được kiểm chứng. Toàn bộ các hạng mục dưới đây cần con người xác minh và phê duyệt trước khi mở thử nghiệm kín hoặc ra mắt công khai.

---

## 1. Trước Cổng Giai đoạn 1 (Thử nghiệm kín)

- [ ] **Chuyên gia tâm lý / Tham vấn lâm sàng thật rà soát:**
  - Duyệt toàn bộ câu chữ giọng điệu (Section 5) trong `src/i18n/vi.ts` và các màn hình Nhật ký / Thư / Tâm trạng.
  - Duyệt ngưỡng nhận diện và kịch bản thẻ hỗ trợ của `shared/riskDetector.ts`.
  - Duyệt nội dung quy trình khủng hoảng trong `docs/SAFETY.md`.
- [ ] **Xác minh thực tế danh bạ hỗ trợ (`server/data/helplines.json`):**
  - Đã kiểm tra cơ bản: `115` (Cấp cứu Y tế Quốc gia), `111` (Tổng đài Quốc gia Bảo vệ Trẻ em — đã ghi rõ phạm vi trẻ em & thanh thiếu niên).
  - **Cần gọi điện xác minh giờ trực, trạng thái hoạt động, phạm vi miễn phí/tính phí cho:**
    - `096 306 1414` (Đường dây nóng Ngày Mai).
    - `024 3852 2087` (Viện Sức khỏe Tâm thần — Bệnh viện Bạch Mai).
    - `028 9234 675` (Bệnh viện Tâm thần TP.HCM).
    - Bổ sung các đường dây / trung tâm tâm lý công lập hoặc phi lợi nhuận uy tín khác đã xác minh bằng văn bản.
- [ ] **Rà soát pháp lý bản nháp Quyền riêng tư (`docs/PRIVACY.md`):**
  - Mời luật sư tại Việt Nam rà soát theo Nghị định 13/2023/NĐ-CP (do dữ liệu sức khỏe tinh thần / cảm xúc là dữ liệu cá nhân nhạy cảm).
- [ ] **Cấu hình biến môi trường Production (`.env`):**
  - Thiết lập `HEALI_DATA_KEY` (64 ký tự hex mạnh, sao lưu ngoại tuyến an toàn), `HEALI_SESSION_SECRET`, `ALLOWED_ORIGIN`, giữ `FEATURE_PAID_SPIRITUAL="false"`.

---

## 2. Trước Cổng Giai đoạn 2 (Mở cộng đồng công khai & Chat người lạ)

- **Phần kỹ thuật đã hoàn thiện trong codebase:**
  - Cổng quản trị nội bộ `/admin` tách biệt, xác thực bằng `HEALI_ADMIN_PASSCODE`, hàng đợi ưu tiên Mức 3 → Mức 2 → Báo cáo, làm mờ nội dung nhạy cảm, lịch sử kiểm toán `moderation_audit_logs`, và công tắc ca trực `/api/community/status`.
  - Bổ sung báo cáo tin nhắn Phòng trà (`lounge:report`), nhắc an toàn định kỳ trong chat 1:1, làm sạch biệt danh chứa số điện thoại/URL/`@handle`, và hàng rào Giai đoạn 2 cho Phòng Tâm Linh (trần phí, cam kết Cố vấn, tạm dừng 24h/người cũ, xóa ngày sinh sau phiên).
- [ ] **Nhân sự kiểm duyệt thật & Vận hành ca trực (Phần 6.5):**
  - Cấu hình `HEALI_ADMIN_PASSCODE` mạnh trên môi trường Production và phân công ca trực rà soát `moderation_queue`.
  - Chốt SLA phản hồi chính thức cho Mức 3, Mức 2 và báo cáo quấy rối trên bảng ca trực.
  - Tổ chức diễn tập ít nhất 1 vòng xử lý tình huống khủng hoảng Mức 2–3 và luân phiên nghỉ giữa ca.
- [ ] **Quy định & hợp đồng Cố vấn Tâm Linh (nếu cân nhắc bật `FEATURE_PAID_SPIRITUAL`):**
  - Soạn bộ quy tắc ứng xử ký kết bản cứng/điện tử với từng Cố vấn (cấm chẩn đoán/chữa bệnh, cấm dự đoán xấu, cấm gài quay lại người cũ để thu phí).
  - Thiết lập quy trình giải quyết khiếu nại / hoàn tiền và nghĩa vụ thuế.


---

## 3. Trước Cổng Giai đoạn 3 (Truyền thông, Đối tác & Sao lưu)

- **Phần kỹ thuật đã hoàn thiện trong codebase:**
  - Trang giới thiệu công khai `/gioi-thieu` (Hero, 3 lời hứa, ranh giới làm/không làm, 4 bài viết kiến thức lành mạnh, FAQ, meta SEO OpenGraph + Twitter + `robots.txt` + `sitemap.xml` + JSON-LD).
  - Tính năng **Gửi một ngọn đèn (`/den/:token`)** giới hạn 5/24h, tự hết hạn sau 14 ngày, khách mở không cần đăng nhập, có nút **Không muốn nhận** xóa sạch lời nhắn ngay.
  - **Đêm Hoa Đăng Cộng Đồng (`/dem-hoa-dang`)** với đồng hồ đếm ngược, lịch định kỳ Rằm / 14/2 / 11/11 và mặt hồ hoa đăng thật.
  - **Thẻ Phản Chiếu Mỗi Ngày** xem trước & xuất PNG qua Canvas hoàn toàn không lộ tên/tâm trạng + **Thử thách dịu dàng 7 đêm tử tế với mình** không phạt chuỗi ngày.
  - Đo lường lành mạnh Phần 8.4 có công tắc Opt-out, cảnh báo quá tải hàng đợi (`>= 12`), tab `/admin` **"Chỉ số lành mạnh (8.4)"**, bộ tài liệu `docs/DESIGN_PRINCIPLES.md` & `docs/marketing/*`, cùng `verifyBackupAndRestore()`.
- [ ] **Cố vấn chuyên môn & Đối tác công khai trên Landing Page:**
  - Chỉ điền tên, chức danh, đơn vị và logo khi **đã có văn bản đồng ý chính thức** từ từng cá nhân/tổ chức (phòng tư vấn tâm lý trường đại học, CLB sinh viên, tổ chức phi lợi nhuận). Xem sẵn đề xuất gửi đối tác ở `docs/marketing/PARTNER_ONE_PAGER.md`.
- [ ] **Phát hành PR / Báo chí & Kênh cộng đồng:**
  - Rà soát thông tin liên hệ thật của nhóm sáng lập trong `docs/marketing/PRESS_FAQ.md` và `docs/marketing/VIDEO_SCRIPTS_AND_CHANNELS.md` trước khi gửi truyền thông.
- [ ] **Chính sách xóa triệt để trên bản sao lưu Production:**
  - Chốt chu kỳ giữ bản sao lưu SQLite (`backups/`) khớp với cam kết xóa vĩnh viễn khi người dùng bấm **Hoá tro** hoặc **Xoá tài khoản** (chạy định kỳ kiểm tra toàn vẹn qua `verifyBackupAndRestore()`).
- [ ] **Rà soát bản quyền âm nhạc bên thứ ba (SoundCloud / Audius):**
  - Kiểm tra điều khoản sử dụng API/embed và ưu tiên kho nhạc có giấy phép Creative Commons / tự sản xuất rõ ràng.

---

## 4. Trước Cổng Giai đoạn 4 (Mở rộng — AI có rào chắn, Đa ngôn ngữ, Đối tác & Âm nhạc)

- **Phần kỹ thuật đã hoàn thiện trong codebase:**
  - **Người đồng hành AI có rào chắn (`server/routes/companion.ts` & `AiCompanionCard.tsx`):** Tắt mặc định, yêu cầu đồng ý rõ ràng trước khi gửi bất kỳ đoạn chữ nào, có nút ngắt tức thì, giới hạn `8 lượt/ngày` (chỉ lưu bộ đếm lượt theo ngày trong `ai_companion_usage` — không lưu nội dung tin nhắn hay phản hồi AI), chạy `detectRisk()` hai lần (trước khi gọi Gemini và trên kết quả trả về từ `gemini-4-hydrogen`), trả lỗi trung thực khi thiếu khóa máy chủ.
  - **Nhạc có giấy phép rõ ràng (`GET /api/music/catalog`):** Đầy đủ siêu dữ liệu `licenseType`, `licenseUrl`, `attribution`, `termsNotice`, `isOfflineCurated` và công tắc lọc chỉ phát nhạc `CC0 / CC BY` ngoại tuyến trên giao diện.
  - **Báo cáo cộng đồng theo quý (`GET /api/community/quarterly-report`):** Tổng hợp số đếm ẩn danh cấp cộng đồng, tự động che mọi chỉ số có từ `1–4` lượt thành `"< 5"` (ngưỡng k-anonymity `>= 5`).
  - **Đề xuất hợp tác tổ chức (`POST /api/partners/inquiry`):** Tiếp nhận đăng ký tài trợ từ trường đại học, doanh nghiệp, NGO với cam kết kỹ thuật không truy cập dữ liệu cá nhân/nhật ký.
  - **Đa ngôn ngữ `VI / EN` (`src/i18n/vi.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`):** Hỗ trợ chuyển đổi tức thì giữa Tiếng Việt và Tiếng Anh cho phần mở đầu, rào chắn an toàn, thẻ hỗ trợ, báo cáo cộng đồng và trợ lý phản chiếu.
- [ ] **Cấu hình `GEMINI_API_KEY` phía máy chủ Production:**
  - Thiết lập khóa API thực trong phần Secrets / biến môi trường phía server (tuyệt đối không đưa vào biến `VITE_*` hay mã nguồn trình duyệt).
- [ ] **Rà soát lâm sàng & pháp lý cho Gương Phản Chiếu AI:**
  - Chuyên gia tâm lý duyệt lại system prompt trong `server/routes/companion.ts` và thông báo đồng ý của người dùng để bảo đảm không vượt ranh giới tham vấn y khoa/tâm lý.
- [ ] **Hiệu đính bản địa hóa Tiếng Anh (`src/i18n/en.ts`):**
  - Biên tập viên song ngữ rà soát sắc thái tự nhiên, dịu nhẹ, tránh lạc quan độc hại cho toàn bộ câu chữ Tiếng Anh.
- [ ] **Ký kết hợp đồng & quy chế với Tổ chức đối tác:**
  - Chỉ công bố tên/logo đối tác và triển khai gói tài trợ sau khi ký văn bản cam kết quyền riêng tư & bảo vệ dữ liệu người dùng.
- [ ] **Kiểm toán định kỳ kho nhạc mở & nguồn phát bên thứ ba:**
  - Xác nhận danh sách `CURATED_OPEN_LICENSE_TRACKS` giữ nguyên trạng thái CC0 / CC BY 3.0 và tách bạch rõ luồng phát bên thứ ba (SoundCloud / Audius).

