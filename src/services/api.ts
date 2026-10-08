import { CardCategory, DayInfo, ItineraryCard } from '../types/trip';
import { AiPlanResult, getIdToken, TripActionError } from './firebase';

export interface PlanTripParams {
  tripId: string;
  departure: string;
  destination: string;
  vehicleType: string;
  vibe?: string;
  notes?: string;
}

interface AiPlanCard {
  startTime?: string;
  endTime?: string;
  title?: string;
  description?: string;
  routeNote?: string;
  gasStationAlert?: string;
  safetyWarning?: string;
  category?: string;
}

interface AiPlanDay {
  dayNumber?: number;
  routeTitle?: string;
  totalKm?: number;
  cards?: AiPlanCard[];
}

interface AiPlanResponse {
  vehicleAdvice?: string;
  gearChecklist?: string[];
  days?: AiPlanDay[];
}

const CARD_CATEGORIES: CardCategory[] = ['departure', 'ride', 'sight', 'food', 'fuel', 'camp', 'stay'];

/**
 * Gọi AI lập lịch trình (chỉ Trưởng đoàn - server kiểm tra lại quyền bằng ID token)
 * và chuyển kết quả thành thẻ lịch trình gắn với từng ngày của tour.
 */
export async function requestAiTripPlan(
  params: PlanTripParams,
  tripDates: string[],
  userId: string
): Promise<AiPlanResult> {
  const token = await getIdToken();
  const res = await fetch('/api/ai/plan-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new TripActionError(json.error || 'Lỗi kết nối AI Server. Vui lòng thử lại!');
  }

  const data = json.data as AiPlanResponse;
  const now = new Date().toISOString();
  const dayInfo: Record<string, DayInfo> = {};
  const cards: Omit<ItineraryCard, 'id'>[] = [];

  // Ngày thứ N của AI gắn với ngày thứ N của tour; bỏ phần thừa nếu AI trả nhiều ngày hơn
  (data.days || []).slice(0, tripDates.length).forEach((day, dayIdx) => {
    const date = tripDates[dayIdx];
    dayInfo[date] = {
      routeTitle: day.routeTitle || '',
      totalKm: Math.max(0, Math.round(Number(day.totalKm) || 0)),
    };
    (day.cards || []).forEach((c, cardIdx) => {
      cards.push({
        date,
        order: cardIdx,
        startTime: c.startTime || '',
        endTime: c.endTime || '',
        title: c.title || 'Chặng phượt',
        description: c.description || '',
        routeNote: c.routeNote || undefined,
        gasStationAlert: c.gasStationAlert || undefined,
        safetyWarning: c.safetyWarning || undefined,
        category: CARD_CATEGORIES.includes(c.category as CardCategory) ? (c.category as CardCategory) : 'ride',
        isCompleted: false,
        createdBy: userId,
        createdAt: now,
      });
    });
  });

  if (cards.length === 0) {
    throw new TripActionError('AI không trả về lịch trình hợp lệ. Vui lòng thử lại!');
  }

  return {
    dayInfo,
    cards,
    gearChecklist: Array.isArray(data.gearChecklist) ? data.gearChecklist : [],
    vehicleAdvice: data.vehicleAdvice || '',
  };
}
