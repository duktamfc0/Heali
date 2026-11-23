import { Router } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, createRateLimiter } from '../middleware/auth.js';
import { detectRisk } from '../../shared/riskDetector.js';

export const companionRouter = Router();

export const AI_COMPANION_DAILY_LIMIT = 8;

const companionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  keyPrefix: 'ai_companion',
});

const reflectSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, 'Hãy viết ít nhất vài từ để trợ lý phản chiếu cùng bạn.')
    .max(1500, 'Đoạn chia sẻ tối đa 1500 ký tự mỗi lượt.'),
  consentAccepted: z.literal(true, {
    error: 'Bạn cần đánh dấu đồng ý gửi đoạn chia sẻ tới máy chủ xử lý AI trước khi dùng tính năng này.',
  }),
  language: z.enum(['vi', 'en']).optional().default('vi'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().trim().max(1200),
      })
    )
    .max(8)
    .optional()
    .default([]),
});

function getTodayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyTurnsUsed(userId: string): number {
  const row = sqliteDb
    .prepare(`SELECT turns_count FROM ai_companion_usage WHERE user_id = ? AND day_bucket = ?`)
    .get(userId, getTodayBucket()) as { turns_count: number } | undefined;
  return row ? row.turns_count : 0;
}

function incrementDailyTurns(userId: string): number {
  const day = getTodayBucket();
  const nowIso = new Date().toISOString();
  sqliteDb
    .prepare(`
      INSERT INTO ai_companion_usage (user_id, day_bucket, turns_count, updated_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, day_bucket) DO UPDATE SET
        turns_count = ai_companion_usage.turns_count + 1,
        updated_at = excluded.updated_at
    `)
    .run(userId, day, nowIso);
  return getDailyTurnsUsed(userId);
}

function buildSystemInstruction(language: 'vi' | 'en', isLastTurn: boolean): string {
  if (language === 'en') {
    return [
      'You are Heali Reflective Mirror — a bounded, calm, non-judgmental AI reflection tool (NOT a human, friend, doctor, or therapist).',
      'STRICT SAFETY & SCOPE RULES:',
      '1. Only mirror and gently summarize what the user just expressed, then ask 1 to 2 short, open-ended questions to help them untangle their own feelings.',
      '2. NEVER diagnose medical/mental conditions, NEVER prescribe medication, and NEVER give therapy treatment plans.',
      '3. NEVER tell the user whether to break up, get back together, contact their ex, or wait for someone.',
      '4. NEVER predict the future or claim spiritual/fate certainty.',
      '5. NEVER roleplay as a deceased loved one, ex-partner, or human companion. Remind briefly if asked that you are an automated reflection tool.',
      '6. NEVER encourage emotional dependency on this AI or ask them to come back just to talk to you. Encourage real-world rest, trusted friends, or licensed professionals when helpful.',
      '7. Keep tone calm, grounded, concise (under 110 words), peer-level, zero toxic positivity ("everything happens for a reason" is forbidden).',
      isLastTurn
        ? '8. This is the final reflection turn for today. Close gently, validate them stepping away from the screen to rest or drink water, and do not prompt further conversation here.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'Bạn là Gương Phản Chiếu trên Heali — một công cụ AI hỗ trợ sắp xếp suy nghĩ có rào chắn (KHÔNG phải con người, không phải bạn thân ngoài đời, không phải bác sĩ hay chuyên viên tâm lý).',
    'QUY TẮC AN TOÀN & PHẠM VI NGHIÊM NGẶT:',
    '1. Chỉ tóm tắt lại điều người dùng vừa viết một cách điềm tĩnh, không phán xét, rồi đặt 1–2 câu hỏi mở nhẹ nhàng để họ tự nhìn rõ cảm xúc của chính mình.',
    '2. TUYỆT ĐỐI KHÔNG chẩn đoán bệnh lý tâm thần/y khoa, không kê đơn hay đưa phác đồ điều trị.',
    '3. TUYỆT ĐỐI KHÔNG khuyên người dùng nên chia tay, quay lại, nhắn tin cho người cũ hay chờ đợi ai đó.',
    '4. TUYỆT ĐỐI KHÔNG bói toán, đoán tương lai hay khẳng định duyên phận.',
    '5. TUYỆT ĐỐI KHÔNG nhập vai người đã mất, người cũ hoặc xưng mình là con người thật có cảm xúc.',
    '6. TUYỆT ĐỐI KHÔNG khuyến khích sự gắn bó lệ thuộc vào AI; khi phù hợp hãy nhẹ nhàng nhắc người dùng nghỉ ngơi, uống nước, thở chậm hoặc trò chuyện với người thật đáng tin cậy ngoài đời.',
    '7. Dùng xưng hô ngang hàng "mình — bạn", ngắn gọn (dưới 120 chữ), giọng văn dịu nhẹ trung thực, tránh lạc quan độc hại (không nói "cơn mưa nào rồi cũng tạnh", "mọi chuyện rồi sẽ ổn").',
    isLastTurn
      ? '8. Đây là lượt phản chiếu cuối cùng trong giới hạn hôm nay. Hãy khép lại thật êm dịu, gợi ý bạn tạm rời màn hình nghỉ ngơi hoặc qua góc Dịu lại, không gợi mở hỏi đáp tiếp.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Check current user's daily allowance & server configuration status (zero prompt logging)
companionRouter.get('/status', authMiddleware, (req, res) => {
  const userId = req.authUser!.id;
  const turnsUsedToday = getDailyTurnsUsed(userId);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  res.json({
    dailyLimit: AI_COMPANION_DAILY_LIMIT,
    turnsUsedToday,
    remainingTurns: Math.max(0, AI_COMPANION_DAILY_LIMIT - turnsUsedToday),
    isConfigured: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
  });
});

// Bounded AI reflective turn (Section 7.3)
companionRouter.post('/reflect', authMiddleware, companionLimiter, async (req, res) => {
  const user = req.authUser!;
  if (user.is_banned) {
    res.status(403).json({ error: 'Tài khoản này hiện không thể sử dụng tính năng này.' });
    return;
  }

  const parsed = reflectSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Yêu cầu phản chiếu AI chưa hợp lệ.',
    });
    return;
  }

  const { message, history, language } = parsed.data;
  const turnsUsedToday = getDailyTurnsUsed(user.id);

  // Enforce daily turn limit to prevent AI over-attachment (Section 7.3)
  if (turnsUsedToday >= AI_COMPANION_DAILY_LIMIT) {
    res.status(429).json({
      code: 'DAILY_LIMIT_REACHED',
      turnsUsedToday,
      dailyLimit: AI_COMPANION_DAILY_LIMIT,
      error:
        language === 'en'
          ? `You've completed ${AI_COMPANION_DAILY_LIMIT} gentle reflection turns for today. To avoid screen fatigue, please pause, drink some water, or try a 1-minute breathing exercise.`
          : `Bạn đã dùng đủ ${AI_COMPANION_DAILY_LIMIT} lượt phản chiếu hôm nay. Để tránh mỏi mắt và phụ thuộc màn hình, bạn hãy tạm nghỉ, uống ngụm nước hoặc thử bài thở 1 phút nhé.`,
    });
    return;
  }

  // Barrier 1: Run detectRisk() BEFORE calling Gemini
  const inputRisk = detectRisk(message);
  if (inputRisk.level >= 2) {
    res.json({
      blockedBySafety: true,
      riskLevel: inputRisk.level,
      supportCardRequired: true,
      turnsUsedToday,
      dailyLimit: AI_COMPANION_DAILY_LIMIT,
    });
    return;
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      code: 'AI_NOT_CONFIGURED',
      error:
        language === 'en'
          ? 'Server-side GEMINI_API_KEY is not configured yet. You can still use Private Journal, Unsent Letters, and Calm breathing tools completely free.'
          : 'Khóa GEMINI_API_KEY phía máy chủ chưa được cấu hình. Bạn vẫn có thể dùng Nhật ký riêng tư, Thư chưa gửi và các bài thở miễn phí bất cứ lúc nào.',
    });
    return;
  }

  const isLastTurn = turnsUsedToday + 1 >= AI_COMPANION_DAILY_LIMIT;
  const contents = [
    ...history.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: message }],
    },
  ];

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction: buildSystemInstruction(language, isLastTurn),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const replyText = (response.text || '').trim();
    if (!replyText) {
      res.status(502).json({
        error:
          language === 'en'
            ? 'The reflection model returned an empty response. Please try again gently.'
            : 'Mô hình phản chiếu tạm thời chưa phản hồi được nội dung. Bạn thử lại sau vài giây nhé.',
      });
      return;
    }

    // Barrier 2: Run detectRisk() on AI OUTPUT as well — discard if >= Level 2
    const outputRisk = detectRisk(replyText);
    if (outputRisk.level >= 2) {
      res.json({
        blockedBySafety: true,
        riskLevel: outputRisk.level,
        supportCardRequired: true,
        turnsUsedToday,
        dailyLimit: AI_COMPANION_DAILY_LIMIT,
      });
      return;
    }

    // Store ONLY the daily integer counter — NEVER store user prompts or AI responses!
    const nextTurns = incrementDailyTurns(user.id);

    res.json({
      reply: replyText,
      blockedBySafety: false,
      riskLevel: inputRisk.level,
      turnsUsedToday: nextTurns,
      dailyLimit: AI_COMPANION_DAILY_LIMIT,
      isClosingTurn: nextTurns >= AI_COMPANION_DAILY_LIMIT,
    });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    console.error('[Heali AI Companion] Gemini request error:', status || 'unknown');
    res.status(status === 429 ? 429 : 502).json({
      error:
        status === 429
          ? language === 'en'
            ? 'The reflection service is busy right now. Please pause and try again in a moment.'
            : 'Dịch vụ phản chiếu đang tạm quá tải. Bạn nghỉ một nhịp rồi thử lại sau nhé.'
          : language === 'en'
          ? 'Could not reach the reflection service right now. Your private text was not saved on the server.'
          : 'Không thể kết nối dịch vụ phản chiếu lúc này. Nội dung bạn vừa viết không được lưu trên máy chủ.',
    });
  }
});
