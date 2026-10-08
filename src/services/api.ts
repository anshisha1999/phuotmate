import { StoryAIResult, ItineraryDay } from '../types/trip';

export interface PlanTripParams {
  departure: string;
  destination: string;
  vehicleType: string;
  daysCount: number;
  vibe?: string;
  notes?: string;
}

export interface StorytellerParams {
  photos: { base64: string; mimeType: string }[];
  tripTitle: string;
  destination: string;
  bikerNotes?: string;
}

export async function requestAiTripPlan(params: PlanTripParams): Promise<{
  tripTitle: string;
  summary: string;
  vehicleAdvice: string;
  gearChecklist: string[];
  days: ItineraryDay[];
}> {
  try {
    const res = await fetch('/api/ai/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi kết nối AI Server');
    }

    const json = await res.json();
    return json.data;
  } catch (error: any) {
    console.warn('Backend AI failed or offline, using fallback local generator:', error);
    return generateFallbackTripPlan(params);
  }
}

export async function requestAiStoryteller(params: StorytellerParams): Promise<StoryAIResult> {
  try {
    const res = await fetch('/api/ai/storyteller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi phân tích ảnh AI');
    }

    const json = await res.json();
    return json.data;
  } catch (error: any) {
    console.warn('Backend Multimodal AI failed or offline, using fallback story:', error);
    return generateFallbackStory(params);
  }
}

// Fallback generator for zero-interruption UX
function generateFallbackTripPlan(params: PlanTripParams) {
  const { departure, destination, vehicleType, daysCount } = params;
  return {
    tripTitle: `Cung Phượt Khám Phá: ${departure} ➔ ${destination}`,
    summary: `Hành trình phượt ${daysCount} ngày chinh phục các cung đèo hùng vĩ từ ${departure} tới ${destination}. Tuyến đường đèo quanh co, cảnh sắc thiên nhiên hoang sơ và văn hóa bản địa độc đáo.`,
    vehicleAdvice: `Dành riêng cho dòng ${vehicleType}: Kiểm tra kỹ hệ thống phanh trước & sau, tăng độ căng sên/nhông xích, bơm lốp đúng áp suất (2.0 - 2.2 bar). Khi đổ đèo dốc gắt TUYỆT ĐỐI không ép số mo (về N) hoặc rà phanh liên tục gây mất thắng nhiệt.`,
    gearChecklist: [
      'Bộ giáp bảo hộ tay chân 4 món + Mũ fullface/3/4',
      'Bộ đồ nghề vá lốp không săm/có săm mini + Bơm điện cầm tay',
      'Áo mưa bộ cánh dơi chống gió lạnh sương mù',
      'Túi cứu thương sơ cứu y tế (băng gạc, salonpas, thuốc đau bụng)',
      'Đèn pin trợ sáng gắn mũ + Pin sạc dự phòng 20.000mAh',
      'Bình xăng dự phòng 1.5L khi vào vùng cao hẻo lánh'
    ],
    days: Array.from({ length: daysCount }).map((_, idx) => ({
      dayNumber: idx + 1,
      dateLabel: `Ngày ${idx + 1}`,
      routeTitle: idx === 0 
        ? `${departure} ➔ Chân Đèo - Khởi Hành Sớm`
        : idx === daysCount - 1
        ? `Chinh Phục Đỉnh Cao & Trở Về`
        : `Xuyên Rừng - Săn Mây & Check-in Bản Làng`,
      totalKm: 140 + idx * 35,
      cards: [
        {
          id: `fb_c_${idx}_1`,
          startTime: '06:30',
          endTime: '08:30',
          title: 'Khởi hành chặng 1 & Bơm xăng đầy bình',
          description: 'Họp đoàn kiểm tra áp suất lốp, phân công người dẫn đoàn (Lead) và chốt đoàn (Sweep). Di chuyển theo đội hình zíc-zắc giữ khoảng cách 15m.',
          routeNote: 'Đoạn đường cửa ngõ giao thông đông đúc, giữ tốc độ 40-50km/h.',
          gasStationAlert: 'Đổ xăng tại trạm Petrolimex lớn trước khi rẽ vào đường đèo tỉnh lộ.',
          safetyWarning: 'Xe tải và xe khách hay lấn làn ở các khúc cua khuất tầm nhìn, bấm còi cảnh báo trước khi vào cua.',
          category: 'departure' as const,
        },
        {
          id: `fb_c_${idx}_2`,
          startTime: '09:00',
          endTime: '11:45',
          title: 'Vượt đèo hiểm trở & Trạm nghỉ ngắm cảnh',
          description: 'Bắt đầu lên dốc cua tay áo liên tục. Không khí lạnh dần, cảnh núi non trùng điệp mở ra hai bên sườn thung lũng.',
          routeNote: 'Đường hẹp, nhiều sỏi dăm nhỏ mép đường, tránh phanh gấp.',
          gasStationAlert: 'Khu vực vùng đèo không có trạm xăng chính thống.',
          safetyWarning: 'Độ dốc trên 10%. Đi số 2 hoặc số 3, nhấp nhả phanh trước sau nhịp nhàng.',
          category: 'ride' as const,
        },
        {
          id: `fb_c_${idx}_3`,
          startTime: '12:00',
          endTime: '13:30',
          title: 'Ăn trưa đặc sản vùng cao & Nghỉ máy xe',
          description: 'Thưởng thức cơm lam, gà đồi nướng hoặc lẩu rau rừng. Để xe máy hạ nhiệt động cơ tối thiểu 45 phút.',
          routeNote: 'Dừng chân quán ven đồi có bóng mát và bãi đỗ an toàn.',
          category: 'food' as const,
        },
        {
          id: `fb_c_${idx}_4`,
          startTime: '14:00',
          endTime: '17:30',
          title: 'Check-in Viewpoint & Về điểm dừng chân',
          description: 'Đón hoàng hôn buông xuống thung lũng. Check-in cột mốc hành trình và di chuyển về Homestay/khu hạ trại trước khi trời tối hẳn.',
          routeNote: 'Sương mù xuất hiện sau 17h, bật đèn trợ sáng vàng phá sương.',
          safetyWarning: 'Tránh chạy đêm đường đèo không có rào chắn bảo vệ.',
          category: 'sight' as const,
        }
      ]
    }))
  };
}

function generateFallbackStory(params: StorytellerParams): StoryAIResult {
  return {
    detectedThemes: ['Cung đường đèo hiểm trở', 'Biker đồng hành', 'Biển mây bồng bềnh', 'Khoảnh khắc hoàng hôn'],
    facebookPost: {
      title: `CHÚNG TA KHÔNG ĐI ĐỂ TÌM KIẾM MỘT NƠI CHỐN, CHÚNG TA ĐI ĐỂ TÌM LẠI CHÍNH MÌNH 🛵⛰️`,
      hook: `Có những cung đường, chỉ cần một lần vít ga vượt qua những khúc cua tay áo trong sương mù sớm, bạn sẽ hiểu vì sao người ta lại nghiện phượt đến vậy!`,
      content: `Chuyến đi ${params.tripTitle} vừa khép lại, nhưng nhịp tim và mùi khói xe máy dường như vẫn còn đọng lại trong từng hơi thở.\n\nBa ngày qua, chúng tôi đã cùng nhau vượt qua hơn 500 cây số. Từ những cơn mưa rừng bất chợt quất rát mặt, đến khoảnh khắc vỡ òa khi đứng trên đỉnh đèo nhìn biển mây cuồn cuộn trôi dưới chân. Xe có thể lấm lem bùn đất, áo giáp có thể ướt đẫm mồ hôi, nhưng nụ cười của anh em khi chạm tay vào cột mốc hành trình thì sáng rực rỡ.\n\nĐẹp nhất không phải là đích đến, mà là lúc cả đoàn dừng lại bên vách đá, chia nhau ngụm nước suối và điếu thuốc thơm giữa mây ngàn.\n\nCảm ơn những người bạn đồng hành tuyệt vời đã luôn giữ vững tay lái và bọc lót cho nhau qua từng khúc cua gắt!`,
      hashtags: ['#PhuotMate', '#DiDeTroVe', '#BikerVietnam', '#TayBac', '#SanMay', '#MotorcycleTrip', '#TuoiTreCuaChungTa']
    },
    reelsScript: {
      title: 'Hành Trình Chinh Phục Cung Đèo - 35s Reel',
      durationSeconds: 35,
      recommendedMusic: 'Đi Để Trở Về (Acoustic Remix) / Indie Travel Vibe Beat',
      hook3s: 'Cảnh POV gắn camera trên cằm mũ bảo hiểm: Bàn tay vít ga, xe lao qua biển mây trắng xoá với câu thoại giật mình: "Ai bảo tuổi trẻ phải an phận?"',
      scenes: [
        {
          sceneNumber: 1,
          timeRange: '00:00 - 00:03',
          visual: 'POV góc nhìn người lái lướt nhanh vào khúc cua đèo mù sương, tay ga siết chặt.',
          voiceover: '"Tuổi trẻ có bao nhiêu lần để bạn dám điên rồ cùng lũ bạn thân?"',
          onScreenText: 'ĐI THÔI KẺO GIÀ! ⛰️🔥'
        },
        {
          sceneNumber: 2,
          timeRange: '00:03 - 00:09',
          visual: 'Flycam quét từ trên cao xuống đoàn xe máy nối đuôi nhau như đàn kiến trên sống lưng khủng long.',
          voiceover: 'Âm thanh tiếng pô xe rền vang hòa cùng nhịp trống dồn dập.',
          onScreenText: '500km ĐÈO DỐC'
        },
        {
          sceneNumber: 3,
          timeRange: '00:09 - 00:18',
          visual: 'Slow-motion 60fps: Bụi đất tung bay dưới bánh xe cào cào, nụ cười rạng rỡ của cả nhóm khi tháo mũ bảo hiểm.',
          voiceover: '"Có những điều sách vở không dạy, chỉ có bánh xe dạy ta bài học về sự tự do."',
          onScreenText: 'TỰ DO TRÊN TỪNG KM'
        },
        {
          sceneNumber: 4,
          timeRange: '00:18 - 00:27',
          visual: 'Cả nhóm ngồi bên mép vực, ly cafe khói nghi ngút trước biển mây hoàng hôn rực sắc cam.',
          voiceover: '"Hoàng hôn hôm nay là phần thưởng cho những đôi chân không mỏi."',
          onScreenText: 'BIỂN MÂY NÀY LÀ CỦA CHÚNG TA'
        },
        {
          sceneNumber: 5,
          timeRange: '00:27 - 00:35',
          visual: 'Cả nhóm đập tay nhau (high-five) quanh đống lửa trại bập bùng, logo PhượtMate hiện lên.',
          voiceover: '"Lên kèo ngay với đứa bạn thân nhất trước khi quá muộn!"',
          onScreenText: 'LÊN KÈO NGAY HÔM NAY 👇'
        }
      ],
      callToAction: 'Tag ngay cạ cứng bạn muốn cùng ngồi sau xe trên cung đường này!'
    }
  };
}
