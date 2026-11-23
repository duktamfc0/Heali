import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectRisk, detectContactOrPaymentInChat } from '../shared/riskDetector.js';

describe('shared/riskDetector — Vietnamese safety detection', () => {
  // 1. Level 0: Normal emotional reflection & safe stories (>= 15 cases)
  const level0Cases = [
    'Hôm nay đi làm về hơi buồn một chút nhưng đã tự nấu được bữa cơm ấm.',
    'Mình nhớ người yêu cũ khi đi qua quán cà phê quen.',
    'Buổi tối trời mưa làm lòng hơi chênh vênh, chỉ muốn nghe tiếng mưa rơi.',
    'Cảm ơn bản thân vì hôm nay đã ngủ sớm hơn một chút.',
    'Hôm nay mình cảm thấy giận vì cuộc chia tay kết thúc trong im lặng.',
    'Đôi khi thấy cô đơn giữa thành phố đông người.',
    'Mình đang học cách chấp nhận rằng mọi chuyện đã qua.',
    'Sáng nay thức dậy thấy ánh nắng ngoài cửa sổ thật dễ chịu.',
    'Tâm trạng hôm nay hơi chùng xuống vì áp lực công việc.',
    'Mình viết lá thư này để nói lời cảm ơn những kỷ niệm cũ.',
    'Trải bài Tarot cho mình nhiều suy ngẫm về sự kiên nhẫn.',
    'Tôi đang tập hít thở chậm 4-7-8 trước khi đi ngủ.',
    'Nhớ gia đình ở quê quá, cuối tuần này sẽ gọi điện cho mẹ.',
    'Thả một ngọn hoa đăng cầu mong bình an cho mọi người.',
    'Mình hơi lo lắng về kỳ thi sắp tới nhưng sẽ cố gắng từng chút.',
  ];

  for (const text of level0Cases) {
    it(`Level 0 safe text: "${text.slice(0, 42)}..."`, () => {
      const res = detectRisk(text);
      assert.equal(res.level, 0);
      assert.equal(res.shouldHoldPublicPost, false);
    });
  }

  // 2. Harmless Vietnamese idioms & negation contexts (>= 18 cases) — MUST NOT false positive
  const harmlessIdiomCases = [
    'Cười chết mất với câu chuyện của đứa bạn thân hôm nay!',
    'cuoi chet mat thoi haha',
    'Hôm nay buồn chết đi được vì trời mưa hoài không đi chơi được.',
    'Làm việc từ sáng tới giờ mệt chết đi được.',
    'met chet roi nguoi oi',
    'Chưa ăn trưa nên đói chết mất thôi.',
    'Ngoài đường nóng chết đi được, 40 độ luôn rồi.',
    'Mùa đông năm nay lạnh chết đi được.',
    'Xem phim ma xong sợ chết khiếp.',
    'Cuối tuần ở nhà chẳng có gì làm, chán chết đi được.',
    'Ngại chết đi được khi gặp lại người quen ở siêu thị.',
    'Thương chết đi được chú mèo nhỏ ngoài hiên.',
    'Mình chỉ buồn chút thôi, không có ý định tự tử hay làm hại bản thân đâu.',
    'Mình chưa bao giờ nghĩ đến chuyện chết cả.',
    'Ngày xưa từng muốn chết nhưng giờ ổn rồi, cảm ơn mọi người.',
    'Trước đây từng muốn chết nhưng giờ bình an vượt qua rồi.',
    'Đẹp chết người luôn ấy, ngắm mãi không chán.',
    'Tiếc chết mất vì lỡ chuyến xe buýt cuối.',
  ];

  for (const text of harmlessIdiomCases) {
    it(`Harmless idiom / negation does NOT trigger: "${text.slice(0, 42)}..."`, () => {
      const res = detectRisk(text);
      assert.equal(res.level, 0, `Expected level 0 for "${text}", got level ${res.level}`);
    });
  }

  // 3. Level 1: High distress (offers gentle grounding, does NOT hold public post) (>= 10 cases)
  const level1Cases = [
    'Hôm nay mình thấy tuyệt vọng quá, mọi thứ cứ rối tung lên.',
    'hom nay toi thay be tac qua',
    'Mình kiệt sức rồi, không chịu nổi nữa.',
    'Tối nào cũng trống rỗng quá, không muốn nhấc tay lên.',
    'Cảm giác không còn lối thoát giữa áp lực gia đình và công việc.',
    'Mình suy sụp hoàn toàn sau cuộc nói chuyện vừa rồi.',
    'Khóc cả đêm không ngừng được, tim nhói không thở nổi.',
    'Thực sự rất bế tắc và kiệt sức.',
    'ko chiu noi nua roi moi nguoi oi',
    'Gục ngã mất rồi, không còn ai bên cạnh.',
  ];

  for (const text of level1Cases) {
    it(`Level 1 high distress: "${text.slice(0, 42)}..."`, () => {
      const res = detectRisk(text);
      assert.equal(res.level, 1, `Expected level 1 for "${text}", got ${res.level}`);
      assert.equal(res.shouldShowSupport, true);
      assert.equal(res.shouldHoldPublicPost, false);
    });
  }

  // 4. Level 2: Passive suicidal ideation (diacritics, unsigned, teencode, elongated chars) (>= 14 cases)
  const level2Cases = [
    'Tôi không muốn sống nữa.',
    'toi khong muon song nua',
    't k muon song nua',
    'ko muon song tiep nua dau',
    'Tôi muốn biến mất khỏi thế giới này.',
    'toi muon bien mat',
    'Ước gì ngày mai không tỉnh dậy nữa.',
    'Chỉ muốn ngủ một giấc không bao giờ tỉnh dậy.',
    'Mọi người sẽ tốt hơn nếu không có tôi.',
    'khong co minh o day thi tot hon',
    'Mình thấy chán sống lắm rồi.',
    'Chắc sống làm gì nữa khi chẳng còn ai cần mình.',
    'Thà chết đi cho xong, chứ đau thế này chịu sao nổi.',
    'Mình hay nghĩ đến chuyện tự tử mỗi khi đêm về.',
    'toi la ganh nang cua moi nguoi',
    'muoooon cheeeet qua di mat',
  ];

  for (const text of level2Cases) {
    it(`Level 2 passive ideation: "${text.slice(0, 42)}..."`, () => {
      const res = detectRisk(text);
      assert.ok(res.level >= 2, `Expected level >= 2 for "${text}", got ${res.level}`);
      assert.equal(res.shouldShowSupport, true);
      assert.equal(res.shouldHoldPublicPost, true);
    });
  }

  // 5. Level 3: Explicit plan, method, or imminence (>= 10 cases)
  const level3Cases = [
    'Đêm nay tôi sẽ tự tử để kết thúc tất cả.',
    'dem nay toi se tu tu',
    'Tôi đã chuẩn bị thuốc ngủ để kết liễu cuộc đời.',
    'Mình định uống thuốc ngủ đêm nay.',
    'Tôi muốn nhảy cầu ngay bây giờ.',
    'Mình đã viết thư tuyệt mệnh rồi.',
    'Tôi sẽ cắt cổ tay tối nay.',
    'Làm sao để chết nhanh và không đau?',
    't se tu sat hom nay thoi',
    'Kết liễu cuộc đời mình ngay tối nay.',
  ];

  for (const text of level3Cases) {
    it(`Level 3 explicit intent: "${text.slice(0, 42)}..."`, () => {
      const res = detectRisk(text);
      assert.equal(res.level, 3, `Expected level 3 for "${text}", got ${res.level}`);
      assert.equal(res.shouldShowSupport, true);
      assert.equal(res.shouldHoldPublicPost, true);
    });
  }

  // 6. Compound idiom + crisis phrase MUST still trigger! (2 cases)
  it('Idiom + real crisis in same message still detects Level 2+', () => {
    const res = detectRisk('Hôm nay mệt chết đi được, thật sự tôi không muốn sống nữa.');
    assert.equal(res.level, 2);
  });

  // 7. Chat contact & payment leak check
  it('Detects Vietnamese phone numbers, URLs, social handles, and banking phrases in stranger chat', () => {
    assert.equal(detectContactOrPaymentInChat('Kết bạn zalo 0912345678 nhé').hasContactOrPayment, true);
    assert.equal(detectContactOrPaymentInChat('Vào link https://evil.com xem nhé').hasContactOrPayment, true);
    assert.equal(detectContactOrPaymentInChat('Chuyển khoản momo cho mình').hasContactOrPayment, true);
    assert.equal(detectContactOrPaymentInChat('Hôm nay trời mưa làm mình hơi nhớ nhà').hasContactOrPayment, false);
  });
});
