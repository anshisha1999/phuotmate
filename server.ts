import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf-8')
);

function decodeTokenUid(idToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf-8'));
    return payload.user_id || payload.sub || null;
  } catch {
    return null;
  }
}

function getTripDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const dates: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

type LeadTripResult =
  | { ok: true; dates: string[] }
  | { ok: false; status: number; error: string };

/**
 * Xác thực người gọi là Trưởng đoàn của 1 tour đang diễn ra.
 * Tour được đọc qua Firestore REST bằng chính ID token của người dùng: Firestore xác minh chữ ký
 * token (token giả/hết hạn bị từ chối) và áp dụng security rules, nên uid trong token là đáng tin.
 */
async function verifyTripLead(authHeader: string | undefined, tripId: unknown): Promise<LeadTripResult> {
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) return { ok: false, status: 401, error: 'Vui lòng đăng nhập để dùng AI.' };
  if (typeof tripId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(tripId)) {
    return { ok: false, status: 400, error: 'Thiếu thông tin tour.' };
  }

  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/trips/${tripId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 401) return { ok: false, status: 401, error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' };
  if (!res.ok) return { ok: false, status: 403, error: 'Bạn không có quyền truy cập tour này.' };

  const fields = (await res.json()).fields || {};
  const uid = decodeTokenUid(idToken);
  if (!uid || fields.createdBy?.stringValue !== uid) {
    return { ok: false, status: 403, error: 'Chỉ Trưởng đoàn mới được dùng AI lập lịch trình.' };
  }
  if (fields.status?.stringValue !== 'active') {
    return { ok: false, status: 403, error: 'Tour đã hoàn thành, không thể chỉnh sửa lịch trình.' };
  }

  const dates = getTripDates(fields.startDate?.stringValue || '', fields.endDate?.stringValue || '');
  if (dates.length === 0) return { ok: false, status: 400, error: 'Ngày đi / ngày về của tour không hợp lệ.' };
  return { ok: true, dates };
}

// --- AI TRIP PLANNER ENDPOINT (chỉ Trưởng đoàn) ---
app.post('/api/ai/plan-trip', async (req, res) => {
  try {
    // Giới hạn độ dài dữ liệu người dùng đưa vào prompt
    const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');
    const tripId = req.body.tripId;
    const departure = clip(req.body.departure, 100);
    const destination = clip(req.body.destination, 100);
    const vehicleType = clip(req.body.vehicleType, 100);
    const vibe = clip(req.body.vibe, 100) || 'Phượt trải nghiệm';
    const notes = clip(req.body.notes, 300);

    if (!departure || !destination) {
      return res.status(400).json({ error: 'Vui lòng cung cấp điểm xuất phát và điểm đến' });
    }

    const lead = await verifyTripLead(req.headers.authorization, tripId);
    if (!lead.ok) {
      return res.status(lead.status).json({ error: lead.error });
    }
    const daysCount = lead.dates.length;

    const systemPrompt = `Bạn là Trưởng đoàn Phượt (Tour Leader / Biker Veteran) 15 năm kinh nghiệm dẫn đoàn khắp các cung đường Tây Bắc, Đông Bắc, Tây Nguyên và Duyên hải miền Trung Việt Nam.
Nhiệm vụ của bạn là lập lịch trình chi tiết theo từng chặng (dạng Card) chuẩn xác cho dân phượt xe máy, đặc biệt chú trọng các yếu tố sinh tồn, an toàn đèo dốc, trạm xăng và thời gian ánh sáng ban ngày.
Các loại xe phổ biến:
- Xe số (Wave, Sirius, Future): leo đèo tốt, phanh số, chú ý trớn dốc.
- Côn tay (Winner X, Exciter, Raider): ghì máy số thấp khi đổ đèo, bình xăng 4-5L.
- Cào cào / Dual-Sport (CRF150/250, XR, WR): đi địa hình, off-road nhẹ sỏi đá.
- Xe phân khối lớn ADV / Touring (CB500X, BMW GS, Versys): nặng xác, ôm cua rộng, cần đường nhựa tốt.
- Xe tay ga (AirBlade, NVX, SH): CHÚ Ý ĐẶC BIỆT tuyệt đối không rà phanh liên tục gây cháy bố phanh, dùng kỹ thuật ghì nhẹ ga khi đổ đèo.

Hãy sinh lịch trình cho chuyến đi từ "${departure}" đến "${destination}" trong ĐÚNG ${daysCount} ngày (${lead.dates.join(', ')}) bằng loại xe "${vehicleType || 'Xe máy số / Côn tay'}".
Phong cách: ${vibe}.
Lưu ý bổ sung: ${notes || 'Không có'}.

Đầu ra BẮT BUỘC theo cấu trúc JSON sau, mảng "days" có đúng ${daysCount} phần tử theo thứ tự ngày:
{
  "vehicleAdvice": "Lời khuyên kỹ thuật riêng cho dòng xe đã chọn (áp suất lốp, dầu nhớt, nhông xích, kỹ thuật phanh)",
  "gearChecklist": ["danh sách 5-8 vật dụng bất ly thân cho cung đường này"],
  "days": [
    {
      "dayNumber": 1,
      "routeTitle": "Chặng chính trong ngày (ví dụ: Hà Nội - Mai Châu - Mộc Châu)",
      "totalKm": 185,
      "cards": [
        {
          "startTime": "06:00",
          "endTime": "07:30",
          "title": "Tập trung điểm hẹn & Xuất phát sớm",
          "description": "Chi tiết cung đường, tốc độ đoàn di chuyển, điểm check-in hoặc ăn sáng.",
          "routeNote": "Cung đường cụ thể (QL6, ĐT128...)",
          "gasStationAlert": "Ghi chú trạm xăng (ví dụ: Cần đổ đầy bình trước khi lên đèo)",
          "safetyWarning": "Cảnh báo an toàn (đoạn dốc cua tay áo, mù sương, xe container cắt cua, bắn tốc độ)",
          "category": "departure | ride | sight | food | fuel | camp | stay"
        }
      ]
    }
  ]
}
Trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc markdown nếu có thể.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Không thể phân tích dữ liệu lịch trình từ AI' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating trip plan:', error);
    return res.status(500).json({ error: 'Lỗi khi tạo lịch trình AI. Vui lòng thử lại!' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`PhượtMate Server running on http://localhost:${port}`);
  });
}

startServer();
