import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing json with generous limit for multimodal base64 photos
app.use(express.json({ limit: '30mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// --- AI TRIP PLANNER ENDPOINT ---
app.post('/api/ai/plan-trip', async (req, res) => {
  try {
    const { departure, destination, vehicleType, daysCount = 3, vibe = 'Phượt trải nghiệm', notes = '' } = req.body;

    if (!departure || !destination) {
      return res.status(400).json({ error: 'Vui lòng cung cấp điểm xuất phát và điểm đến' });
    }

    const systemPrompt = `Bạn là Trưởng đoàn Phượt (Tour Leader / Biker Veteran) 15 năm kinh nghiệm dẫn đoàn khắp các cung đường Tây Bắc, Đông Bắc, Tây Nguyên và Duyên hải miền Trung Việt Nam.
Nhiệm vụ của bạn là lập lịch trình chi tiết theo từng chặng (dạng Card) chuẩn xác cho dân phượt xe máy, đặc biệt chú trọng các yếu tố sinh tồn, an toàn đèo dốc, trạm xăng và thời gian ánh sáng ban ngày.
Các loại xe phổ biến:
- Xe số (Wave, Sirius, Future): leo đèo tốt, phanh số, chú ý trớn dốc.
- Côn tay (Winner X, Exciter, Raider): ghì máy số thấp khi đổ đèo, bình xăng 4-5L.
- Cào cào / Dual-Sport (CRF150/250, XR, WR): đi địa hình, off-road nhẹ sỏi đá.
- Xe phân khối lớn ADV / Touring (CB500X, BMW GS, Versys): nặng xác, ôm cua rộng, cần đường nhựa tốt.
- Xe tay ga (AirBlade, NVX, SH): CHÚ Ý ĐẶC BIỆT tuyệt đối không rà phanh liên tục gây cháy bố phanh, dùng kỹ thuật ghì nhẹ ga khi đổ đèo.

Hãy sinh lịch trình cho chuyến đi từ "${departure}" đến "${destination}" trong ${daysCount} ngày bằng loại xe "${vehicleType || 'Xe máy số / Côn tay'}".
Phong cách: ${vibe}.
Lưu ý bổ sung: ${notes || 'Không có'}.

Đầu ra BẮT BUỘC theo cấu trúc JSON sau:
{
  "tripTitle": "Tên chuyến đi hấp dẫn, đậm chất phượt",
  "summary": "Tổng quan cung đường, tổng số km dự kiến, độ khó (Dễ/Trung bình/Khó/Thử thách)",
  "vehicleAdvice": "Lời khuyên kỹ thuật riêng cho dòng xe đã chọn (áp suất lốp, dầu nhớt, nhông xích, kỹ thuật phanh)",
  "gearChecklist": ["danh sách 5-8 vật dụng bất ly thân cho cung đường này"],
  "days": [
    {
      "dayNumber": 1,
      "dateLabel": "Ngày 1",
      "routeTitle": "Chặng chính trong ngày (ví dụ: Hà Nội - Mai Châu - Mộc Châu)",
      "totalKm": 185,
      "cards": [
        {
          "id": "c1_1",
          "startTime": "06:00",
          "endTime": "07:30",
          "title": "Tập trung điểm hẹn & Xuất phát sớm",
          "description": "Chi tiết cung đường, tốc độ đoàn di chuyển, điểm check-in hoặc ăn sáng.",
          "routeNote": "Cung đường cụ thể (QL6, ĐT128...)",
          "gasStationAlert": "Ghi chú trạm xăng (ví dụ: Cần đổ đầy bình trước khi lên đèo)",
          "safetyWarning": "Cảnh báo an toàn (đoạn dốc cua tay áo, mù sương, xe container cắt cua, bắn tốc độ)",
          "category": "departure | ride | sight | food | camp | stay"
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
    return res.status(500).json({
      error: 'Lỗi khi tạo lịch trình AI',
      message: error?.message || 'Internal Server Error'
    });
  }
});

// --- AI MULTIMODAL STORYTELLER & REELS SCRIPT ENDPOINT ---
app.post('/api/ai/storyteller', async (req, res) => {
  try {
    const { photos = [], tripTitle = 'Cung đường phượt Việt Nam', destination = '', bikerNotes = '' } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất 1-3 bức ảnh để AI phân tích' });
    }

    const parts: any[] = [];

    // Add photos (inlineData with base64 and mimeType)
    for (const photo of photos.slice(0, 5)) {
      if (photo.base64 && photo.mimeType) {
        // Strip data:image/...;base64, prefix if present
        const cleanBase64 = photo.base64.replace(/^data:image\/[a-zA-Z0-9-+.]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: cleanBase64
          }
        });
      }
    }

    const promptText = `Bạn là một Blogger Du Lịch Phượt & Video Creator chuyên nghiệp hàng đầu Việt Nam.
Tôi gửi cho bạn ${parts.length} tấm ảnh chụp thực tế trong chuyến đi phượt "${tripTitle}" ${destination ? `tại ${destination}` : ''}.
Ghi chú thêm từ phượt thủ: "${bikerNotes}".

Hãy phân tích kỹ các bức ảnh (phong cảnh, xe cộ, trang phục bảo hộ, bầu trời, cung đèo, hoàng hôn, cắm trại, nhóm bạn, nụ cười...) và sáng tạo ra 2 nội dung:

1. BÀI VIẾT NHẬT KÝ FACEBOOK / CỘNG ĐỒNG PHƯỢT:
- Giọng văn chân thực, phong trần, đậm chất "xê dịch", truyền cảm hứng mạnh mẽ nhưng không sáo rỗng.
- Tiêu đề giật tít thu hút cảm xúc.
- Các đoạn kể về cảm giác cầm lái, những khúc cua, cơn mưa rừng hoặc ly cafe ngắm biển mây, tình anh em đồng đội.
- Thông số hữu ích cho người đi sau (khoảng cách, địa danh check-in có trong ảnh).
- Bộ hashtag chuẩn xịn (#phuot, #vietnamtravel, #bikerlife, #di_de_tro_ve...).

2. BẢNG KỊCH BẢN VIDEO NGẮN (REELS / TIKTOK / SHORTS) TỪ 30 - 45 GIÂY:
- Hook cực mạnh trong 3 giây đầu để giữ chân người xem.
- Danh sách 5-7 cảnh (Scenes) tương ứng với góc máy trong ảnh và cảnh bổ trợ.
- Từng cảnh có:
  + Scene: Tên cảnh & thời lượng (giây)
  + Visual: Mô tả góc máy (Flycam quét ngang, POV gắn mũ bảo hiểm nhìn ghi đông, Slow-motion xòe tay đón gió, Zoom-in xe máy bên vách đá)
  + Audio / Voiceover: Lời bình thoại hoặc nhịp điệu âm thanh
  + On-screen Text: Chữ chạy trên màn hình (Typo)
- Nhạc nền đề xuất (Trending song / Thể loại nhạc phối cùng).

Đầu ra định dạng JSON CHÍNH XÁC:
{
  "detectedThemes": ["danh sách các nét nổi bật nhận diện từ ảnh, vd: Biển mây Tà Xùa, xe số đổ đèo, lửa trại"],
  "facebookPost": {
    "title": "Tiêu đề bài viết",
    "hook": "Câu mở đầu hút tương tác",
    "content": "Nội dung bài viết đầy đủ (được chia đoạn rõ ràng bằng xuống dòng \\n\\n)",
    "hashtags": ["#phuot", "#vietnam", "..."]
  },
  "reelsScript": {
    "title": "Tiêu đề video Reels",
    "durationSeconds": 38,
    "recommendedMusic": "Tên bài hát hoặc phong cách nhạc (ví dụ: 'Nơi này có anh - Indie Acoustic' hoặc 'Phút Ban Đầu - Chill Lofi Beat')",
    "hook3s": "Hook 3 giây đầu tiên (Hình ảnh & Lời thoại mở màn)",
    "scenes": [
      {
        "sceneNumber": 1,
        "timeRange": "00:00 - 00:03",
        "visual": "Mô tả góc máy & hiệu ứng chuyển cảnh",
        "voiceover": "Lời thuyết minh hoặc âm thanh tự nhiên (tiếng pô xe, tiếng gió)",
        "onScreenText": "Chữ phụ đề ngắn bắt mắt"
      }
    ],
    "callToAction": "Câu kết kêu gọi lưu clip hoặc tag bạn đồng hành"
  }
}
Chỉ trả về JSON hợp lệ.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      }
    });

    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Không thể phân tích phản hồi AI từ ảnh' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating multimodal story:', error);
    return res.status(500).json({
      error: 'Lỗi khi phân tích ảnh qua Gemini',
      message: error?.message || 'Internal Server Error'
    });
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
