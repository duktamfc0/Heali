import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';

export const helplinesRouter = Router();

const HELPLINES_PATH = path.resolve(process.cwd(), 'server', 'data', 'helplines.json');

helplinesRouter.get('/', (_req, res) => {
  try {
    const raw = fs.readFileSync(HELPLINES_PATH, 'utf-8');
    const data = JSON.parse(raw);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    console.error('[Heali Helplines] Read error:', err);
    res.json({
      lastReviewedAt: '2025-05-01',
      helplines: [
        {
          id: 'vn-115',
          name: 'Cấp cứu Y tế khẩn cấp (Quốc gia)',
          phone: '115',
          hours: '24/7 (Toàn quốc)',
          free: false,
          scope: 'Tình huống nguy hiểm đến tính mạng hoặc cần cấp cứu y tế ngay.',
          verificationStatus: 'verified_official',
          lastUpdated: '2025-05-01',
          note: 'Hãy gọi 115 hoặc nhờ người ở gần đưa đến cơ sở y tế gần nhất.',
        },
      ],
    });
  }
});
