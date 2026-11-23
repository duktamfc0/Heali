/**
 * Centralized Vietnamese copy adhering to Section 5 Tone Guidelines:
 * - Peer-level ("bạn" / "mình"), calm, short sentences.
 * - No toxic positivity ("cơn mưa nào rồi cũng tạnh"), no assumed feelings,
 *   no app claiming human-like empathy ("Tôi thấu hiểu cơn đau của bạn"), no certainty promises.
 */
export const VI_COPY = {
  brandTagline: 'Một góc nhỏ yên tĩnh cho lúc lòng vỡ. Ẩn danh. Không phán xét. Không quảng cáo.',
  crisisButtonLabel: 'Cần giúp ngay',
  betaNotice:
    'Đây là bản thử nghiệm kín của Heali. Một số phần cộng đồng đang bật chế độ kiểm duyệt an toàn; nếu bạn thấy điều gì chưa ổn hoặc dễ gây mệt, hãy nhắn lại ở mục Quyền riêng tư & An toàn.',
  promises: [
    'An toàn: luôn có đường tới hỗ trợ khủng hoảng trong một chạm.',
    'Trung thực: không số liệu giả, không hứa điều ứng dụng không làm được.',
    'Tôn trọng: dữ liệu riêng tư là của bạn; không bán và không khai thác nỗi đau.',
  ],
  onboarding: {
    skipLabel: 'Bỏ qua',
    nextLabel: 'Tiếp tục',
    finishLabel: 'Vào không gian của bạn',
    step1Title: 'Chào bạn đến với Heali',
    step1Subtitle:
      'Một góc nhỏ yên tĩnh cho lúc lòng vỡ. Heali không phải bác sĩ hay chuyên gia trị liệu, chỉ là nơi bạn tạm ngồi nghỉ và sắp xếp lại lòng mình.',
    step2Title: 'Hôm nay bạn cần gì nhất?',
    step2Subtitle:
      'Câu trả lời chỉ dùng để gợi ý 1–2 việc vừa sức ngay đầu trang, không ẩn bớt bất kỳ tính năng nào.',
    needs: [
      {
        id: 'release' as const,
        title: 'Xả ra',
        desc: 'Viết nhật ký hoặc thư chưa gửi cho những điều còn nghẹn.',
      },
      {
        id: 'calm' as const,
        title: 'Dịu lại',
        desc: 'Thở chậm, chạm đất 5-4-3-2-1 hoặc nghe mưa êm.',
      },
      {
        id: 'together' as const,
        title: 'Có ai đó bên cạnh',
        desc: 'Đọc vài dòng đồng cảm ẩn danh trong không gian kiểm duyệt.',
      },
      {
        id: 'quiet' as const,
        title: 'Chỉ muốn yên lặng',
        desc: 'Ngồi một lát bên hồ hoa đăng, không phải nói hay làm gì cả.',
      },
    ],
    step3Title: 'Luôn có nút hỗ trợ và quyền riêng tư thuộc về bạn',
    step3Bullets: [
      'Nút "Cần giúp ngay" màu đỏ đất luôn cố định ở góc trên mọi màn hình để bạn chạm trong một nhịp.',
      'Bạn dùng hoàn toàn ẩn danh, có thể đặt khóa mã PIN, tải toàn bộ dữ liệu về máy hoặc xóa vĩnh viễn tài khoản bất cứ lúc nào.',
      'Khi chọn "Hoá tro" một bức thư, nội dung thư sẽ được xóa thật khỏi máy chủ.',
    ],
  },
  navGroups: {
    self: 'Cho riêng mình',
    calm: 'Dịu lại',
    community: 'Cùng người khác',
    explore: 'Khám phá',
  },
  moodCheckin: {
    heading: 'Lúc này bạn đang thấy thế nào?',
    lowMoodSupport:
      'Hôm nay đang rất nặng. Bạn không cần làm gì cả. Nếu muốn, mình có vài việc nhỏ có thể giúp qua đoạn này.',
    recordedNeutral: 'Đã ghi lại tâm trạng lúc này cho riêng bạn.',
    breatheCta: 'Thở cùng mình 1 phút',
    writeCta: 'Viết ra một chút',
    helpCta: 'Tôi cần nói chuyện với ai đó',
    weeklySummaryPrefix: 'Tuần này bạn đã dành',
    weeklySummarySuffix: 'lần dừng lại lắng nghe bản thân.',
    emptyWeeklySummary: 'Không có áp lực chuỗi ngày. Bạn có thể ghé lại bất cứ khi nào cần.',
  },
  emotionWheel: [
    {
      name: 'Giận',
      definition: 'Cảm giác bứt rứt, ấm ức hoặc phản kháng trước điều vừa xảy ra.',
    },
    {
      name: 'Lo âu',
      definition: 'Ngực hơi thắt, đầu hay nghĩ về chuyện sắp tới hoặc sợ mất kiểm soát.',
    },
    {
      name: 'Tê liệt',
      definition: 'Trống rỗng, khó khóc và khó gọi rõ tên cảm xúc lúc này.',
    },
    {
      name: 'Tội lỗi',
      definition: 'Tự trách bản thân vì những chuyện đã qua hoặc điều chưa làm trọn.',
    },
    {
      name: 'Nhớ nhung',
      definition: 'Nhớ một người, một giọng nói hay thói quen cũ dù mọi thứ đã đổi khác.',
    },
    {
      name: 'Trống rỗng',
      definition: 'Hụt hẫng, mất phương hướng khi một điểm tựa quen thuộc vừa rời đi.',
    },
    {
      name: 'Kiệt sức',
      definition: 'Mệt cả thân lẫn tâm sau nhiều đêm suy nghĩ hoặc gồng mình.',
    },
    {
      name: 'Nhẹ lòng',
      definition: 'Có một khoảng thở dễ chịu hơn đôi chút ngay lúc này.',
    },
  ],
  journal: {
    midnightHint:
      'Đã khuya rồi. Nếu thấy mệt, bạn có thể viết vài dòng ngắn rồi nghỉ, hoặc sang mục Dịu lại nghe một chút âm thanh để dễ ngủ.',
    recommendedDurationHint:
      'Gợi ý viết khoảng 15–20 phút rồi tạm dừng, tránh lặp đi lặp lại một suy nghĩ quá lâu.',
    guidedSteps: [
      {
        key: 'happened',
        label: '1. Chuyện gì vừa xảy ra?',
        placeholder: 'Kể lại ngắn gọn sự việc như nó diễn ra, chưa cần phân tích đúng sai...',
      },
      {
        key: 'body',
        label: '2. Cơ thể và cảm xúc lúc này thế nào?',
        placeholder: 'Ví dụ: vai đang gồng, mắt cay, thấy tủi thân hay trống rỗng...',
      },
      {
        key: 'need',
        label: '3. Mình đang cần gì ngay lúc này?',
        placeholder: 'Ví dụ: một cốc nước ấm, tắt điện thoại 30 phút, hoặc nói chuyện với một người bạn...',
      },
      {
        key: 'kindness',
        label: '4. Một việc nhỏ tử tế với bản thân hôm nay',
        placeholder: 'Chỉ một việc rất nhỏ và làm được ngay (có thể bỏ qua)...',
      },
    ],
    postWriteTitle: 'Đã lưu trang viết riêng tư',
    postWriteBody:
      'Bạn vừa đặt một phần suy nghĩ xuống giấy. Nếu muốn, hãy dành 1 phút hạ nhiệt trước khi rời màn hình.',
    undoDeleteBanner: 'Đã xoá trang nhật ký.',
    undoButton: 'Hoàn tác (10 giây)',
  },
  unsentLetters: {
    burnWarning:
      'Khi chọn "Hoá tro (xoá hẳn)", nội dung bức thư sẽ bị xoá vĩnh viễn khỏi máy chủ và không thể khôi phục lại.',
    burnCompleteTitle: 'Đã xoá bức thư',
    burnCompleteBody:
      'Lá thư đã không còn lưu ở đây. Bạn không cần thấy nhẹ nhõm ngay. Có thể cần thêm thời gian, và như vậy cũng ổn.',
    sealOptionHint: 'Hoặc niêm phong tạm thời đến một ngày trong tương lai để đọc lại khi sẵn sàng.',
  },
  exUrge: {
    buttonLabel: 'Tôi sắp nhắn cho người cũ',
    title: 'Khoảng dừng 10 phút trước khi gửi tin',
    subtitle:
      'Không có lệnh cấm hay phán xét nào ở đây. Chỉ là một khoảng nghỉ ngắn để bạn nghe xem mình thực sự cần gì lúc này.',
    questionLabel: 'Bạn đang mong điều gì nhất từ tin nhắn sắp gửi?',
    intentOptions: [
      'Chỉ muốn bớt cảm giác cô đơn ngay lúc này',
      'Muốn biết họ có còn nhớ tới mình không',
      'Muốn nói nốt một câu cho nhẹ lòng',
      'Thói quen nhắn vào giờ này, chưa rõ lý do',
    ],
    draftLabel: 'Viết thử tin nhắn bạn định gửi ra đây (chỉ mình bạn thấy)',
    moveToUnsentLabel: 'Chuyển thành Thư chưa gửi',
  },
  calmTools: {
    heading: 'Dịu lại trong 3 phút',
    subtitle:
      'Không cần đăng nhập, không cần giải thích dài dòng. Chọn một công cụ nhỏ vừa sức lúc này.',
  },
  realWorldBridge: {
    title: 'Khi muốn quay về với đời thực xung quanh',
    body: 'Heali chỉ là góc trú tạm, không thể thay thế cái ôm hay cuộc trò chuyện thật ngoài đời. Nếu nỗi buồn kéo dài hơn 2–3 tuần hoặc bắt đầu làm gián đoạn giấc ngủ, bữa ăn, công việc hay việc học, hãy cân nhắc chia sẻ với một người bạn tin tưởng hoặc tìm đến bác sĩ / chuyên viên tâm lý có chứng chỉ.',
    disclaimer: 'Thông tin trên Heali chỉ mang tính tự chăm sóc và gợi ý, không phải chẩn đoán y khoa.',
  },
  supportPrompts: {
    level1Title: 'Có vẻ đoạn này đang khá nặng với bạn.',
    level1Body:
      'Bạn không cần phải gồng lên hoặc giải quyết hết ngay bây giờ. Nếu muốn, bạn có thể tạm nghỉ một nhịp.',
    level2Question: 'Bạn có đang nghĩ đến việc làm hại bản thân không?',
    level2Body:
      'Chữ bạn vừa viết vẫn được giữ nguyên. Nếu mọi thứ đang quá sức chịu đựng, bạn không phải giữ một mình.',
    level2CallCta: 'Cho mình xem nơi có thể gọi ngay',
    level2ContinueCta: 'Tôi ổn, cứ để mình viết tiếp',
    level3Title: 'Điều quan trọng nhất lúc này là sự an toàn của bạn',
    level3Body:
      'Nếu bạn đang nghĩ đến việc tự làm hại mình ngay lúc này, hãy gọi cấp cứu hoặc tìm người đang ở gần bạn để không phải ở một mình.',
    trustedSmsTemplate:
      'Mình đang thấy rất nặng lòng và không muốn ở một mình lúc này. Bạn có rảnh nghe mình nói chuyện hoặc ngồi cùng mình một lát không?',
  },
  confessions: {
    heldNotice:
      'Bài viết của bạn có chứa nội dung dễ gây tổn thương nên chưa hiển thị công khai ngay và đã chuyển vào hàng đợi rà soát an toàn. Nếu bạn đang thấy quá sức, hãy xem các số hỗ trợ bên dưới.',
  },
  spiritual: {
    disclaimer:
      'Lưu ý: Trải bài Tarot, Tử Vi và Số Học trên Heali chỉ là công cụ gợi mở suy ngẫm & giải trí, không phải dự đoán tương lai và không thay thế tư vấn tâm lý, y tế, pháp lý hay tài chính.',
    paidDisabledNotice:
      'Tính năng thu phí đang tắt (chế độ miễn phí thử nghiệm) cho đến khi hoàn tất quy tắc cố vấn, cơ chế bảo vệ tài chính và rà soát pháp lý.',
  },
} as const;
