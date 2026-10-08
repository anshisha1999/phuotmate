import React, { useState } from 'react';
import { Trip, ItineraryCard, CardCategory, UserProfile } from '../../types/trip';
import {
  TripPermissions, getTripDates, formatShortDate, todayDateString
} from '../../services/tripRules';
import {
  addCard, updateCard, deleteCard, swapCardOrder, updateDayInfo, describeFirebaseError
} from '../../services/firebase';
import {
  Sparkles, Plus, Clock, MapPin, Fuel, ShieldAlert, CheckCircle2,
  Circle, ChevronUp, ChevronDown, Trash2, Edit3, Bike, Lock,
  Camera, Tent, Utensils, X, Compass, Pencil
} from 'lucide-react';

interface ItineraryViewProps {
  trip: Trip;
  cards: ItineraryCard[];
  currentUser: UserProfile;
  permissions: TripPermissions;
  onOpenAiPlanner: () => void;
}

type CardDraft = Pick<
  ItineraryCard,
  'title' | 'startTime' | 'endTime' | 'category' | 'description' | 'routeNote' | 'gasStationAlert' | 'safetyWarning'
>;

const EMPTY_DRAFT: CardDraft = {
  title: '',
  startTime: '08:00',
  endTime: '10:00',
  category: 'ride',
  description: '',
  routeNote: '',
  gasStationAlert: '',
  safetyWarning: '',
};

const reportError = (fallback: string) => (error: unknown) => {
  console.error(error);
  alert(describeFirebaseError(error, fallback));
};

// Helper icons for categories
const getCategoryMeta = (cat: CardCategory) => {
  switch (cat) {
    case 'departure':
      return { label: 'Khởi hành', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Bike };
    case 'ride':
      return { label: 'Đổ đèo / Di chuyển', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Compass };
    case 'sight':
      return { label: 'Ngắm cảnh / Check-in', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Camera };
    case 'food':
      return { label: 'Ăn uống / Cà phê', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Utensils };
    case 'fuel':
      return { label: 'Trạm xăng / Kỹ thuật', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Fuel };
    case 'camp':
    case 'stay':
      return { label: 'Nghỉ đêm / Cắm trại', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Tent };
    default:
      return { label: 'Chặng phượt', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Bike };
  }
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  cards,
  currentUser,
  permissions,
  onOpenAiPlanner,
}) => {
  const { canEdit, canUseAi } = permissions;
  const tripDates = getTripDates(trip.startDate, trip.endDate);

  // Mặc định mở ngày hôm nay nếu đang trong chuyến đi
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = todayDateString();
    return tripDates.includes(today) ? today : tripDates[0] || '';
  });
  const currentDate = tripDates.includes(selectedDate) ? selectedDate : tripDates[0] || '';
  const currentDayIndex = tripDates.indexOf(currentDate);
  const dayInfo = trip.dayInfo[currentDate];
  const dayCards = cards
    .filter((c) => c.date === currentDate)
    .sort((a, b) => a.order - b.order);

  // Thẻ đang thêm (id rỗng) hoặc đang sửa
  const [cardForm, setCardForm] = useState<{ id: string; draft: CardDraft } | null>(null);
  const [dayForm, setDayForm] = useState<{ routeTitle: string; totalKm: number } | null>(null);

  const handleMove = (index: number, direction: -1 | 1) => {
    const other = dayCards[index + direction];
    if (!other) return;
    swapCardOrder(trip.id, dayCards[index], other).catch(reportError('Không đổi được thứ tự chặng.'));
  };

  const handleToggleCompleted = (card: ItineraryCard) => {
    updateCard(trip.id, card.id, { isCompleted: !card.isCompleted }).catch(reportError('Không cập nhật được chặng.'));
  };

  const handleDeleteCard = (card: ItineraryCard) => {
    if (confirm('Bạn chắc chắn muốn xóa thẻ chặng này?')) {
      deleteCard(trip.id, card.id).catch(reportError('Không xóa được chặng.'));
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm || !cardForm.draft.title.trim()) return;

    const { draft } = cardForm;
    const fields = {
      title: draft.title.trim(),
      startTime: draft.startTime,
      endTime: draft.endTime,
      category: draft.category,
      description: draft.description.trim() || 'Chặng phượt trải nghiệm.',
      routeNote: draft.routeNote?.trim() || '',
      gasStationAlert: draft.gasStationAlert?.trim() || '',
      safetyWarning: draft.safetyWarning?.trim() || '',
    };

    if (cardForm.id) {
      updateCard(trip.id, cardForm.id, fields).catch(reportError('Không lưu được thẻ chặng.'));
    } else {
      addCard(trip.id, {
        ...fields,
        date: currentDate,
        order: dayCards.length > 0 ? Math.max(...dayCards.map((c) => c.order)) + 1 : 0,
        isCompleted: false,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      }).catch(reportError('Không tạo được thẻ chặng.'));
    }
    setCardForm(null);
  };

  const handleSaveDayInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayForm) return;
    updateDayInfo(trip.id, currentDate, {
      routeTitle: dayForm.routeTitle.trim(),
      totalKm: Math.max(0, Math.round(dayForm.totalKm || 0)),
    }).catch(reportError('Không lưu được thông tin ngày.'));
    setDayForm(null);
  };

  const updateDraft = (patch: Partial<CardDraft>) =>
    setCardForm((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Top AI Action Banner (chỉ Trưởng đoàn) */}
      {canUseAi ? (
        <div className="p-3.5 rounded-3xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-slate-900 border border-orange-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Lên Lịch Trình Tự Động</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-orange-500/80 text-white rounded font-mono">
                  GEMINI FLASH
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Lập lại toàn bộ {tripDates.length} ngày (xóa lịch trình hiện tại)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAiPlanner}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            Lập Lịch AI
          </button>
        </div>
      ) : !canEdit ? (
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {trip.status === 'completed'
              ? 'Tour đã hoàn thành • Lịch trình chỉ để xem lại.'
              : 'Bạn đã rời tour • Lịch trình chỉ để xem.'}
          </span>
        </div>
      ) : null}

      {/* Days Tabs Slider - mỗi tab là 1 ngày thật của tour */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tripDates.map((date, idx) => {
          const isActive = date === currentDate;
          const dateCards = cards.filter((c) => c.date === date);
          const completedCount = dateCards.filter((c) => c.isCompleted).length;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-start px-3.5 py-2 rounded-2xl border transition-all shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-102 font-bold'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <span>Ngày {idx + 1}</span>
                {dateCards.length > 0 && (
                  <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-black/20 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                    {completedCount}/{dateCards.length}
                  </span>
                )}
              </div>
              <div className={`text-[10px] ${isActive ? 'text-orange-100' : 'text-slate-500'}`}>
                {formatShortDate(date)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Day Header */}
      {currentDate && (
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
              Ngày {currentDayIndex + 1} • {formatShortDate(currentDate)} • {dayInfo?.totalKm || 0} km dự kiến
            </div>
            <h2 className="text-xs font-bold text-white truncate mt-0.5">
              {dayInfo?.routeTitle || 'Chưa đặt tên chặng cho ngày này'}
            </h2>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setDayForm({ routeTitle: dayInfo?.routeTitle || '', totalKm: dayInfo?.totalKm || 0 })}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                title="Sửa tên chặng & số km của ngày"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCardForm({ id: '', draft: EMPTY_DRAFT })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>Thêm thẻ</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cards List with Reorder Controls */}
      <div className="space-y-3">
        {dayCards.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-6 space-y-3">
            <Bike className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">Chưa có chặng nào trong ngày này</h4>
            {canEdit && (
              <>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {canUseAi
                    ? 'Nhấn "Lập Lịch AI" để tự động sinh lịch trình hoặc thêm thẻ chặng thủ công.'
                    : 'Thêm thẻ chặng thủ công cho ngày này.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  {canUseAi && (
                    <button
                      onClick={onOpenAiPlanner}
                      className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg"
                    >
                      Trợ Lý AI Lên Lịch
                    </button>
                  )}
                  <button
                    onClick={() => setCardForm({ id: '', draft: EMPTY_DRAFT })}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    + Thêm thủ công
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          dayCards.map((card, idx) => {
            const meta = getCategoryMeta(card.category);
            const Icon = meta.icon;

            return (
              <div
                key={card.id}
                className={`relative rounded-3xl border transition-all duration-200 overflow-hidden ${
                  card.isCompleted
                    ? 'bg-slate-950/60 border-slate-900 opacity-75'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Card Top Strip: Category & Time & Reorder buttons */}
                <div className="p-3.5 pb-2 border-b border-slate-800/60 flex items-center justify-between gap-2 bg-slate-950/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => handleToggleCompleted(card)}
                      disabled={!canEdit}
                      className="text-slate-400 hover:text-emerald-400 transition disabled:hover:text-slate-400"
                      title={card.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      {card.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{meta.label}</span>
                    </span>

                    <span className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-300">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{card.startTime} - {card.endTime}</span>
                    </span>
                  </div>

                  {/* Reorder and action controls */}
                  {canEdit && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="Chuyển lên trước"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === dayCards.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="Chuyển xuống sau"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCardForm({ id: card.id, draft: { ...EMPTY_DRAFT, ...card } })}
                        className="p-1 text-slate-400 hover:text-orange-400 transition"
                        title="Chỉnh sửa chặng"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                        title="Xóa chặng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Main Body */}
                <div className="p-3.5 space-y-2">
                  <h4 className={`text-sm font-bold leading-snug ${card.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Route note */}
                  {card.routeNote && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong className="text-slate-300">Cung đường:</strong> {card.routeNote}</span>
                    </div>
                  )}

                  {/* Gas station alert */}
                  {card.gasStationAlert && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong className="text-amber-200">Trạm xăng tiếp tế:</strong> {card.gasStationAlert}</span>
                    </div>
                  )}

                  {/* Mountain pass safety warning */}
                  {card.safetyWarning && (
                    <div className="flex items-start gap-1.5 text-[11px] text-red-300 bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span><strong className="text-red-200">Cảnh báo an toàn đèo dốc:</strong> {card.safetyWarning}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Card Modal */}
      {cardForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                {cardForm.id ? 'Chỉnh Sửa Thẻ Chặng' : `Thêm Thẻ Chặng • Ngày ${currentDayIndex + 1} (${formatShortDate(currentDate)})`}
              </h3>
              <button onClick={() => setCardForm(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tiêu đề chặng:</label>
                <input
                  type="text"
                  placeholder="Vd: Vượt đèo Mã Pí Lèng ngắm sông Nho Quế"
                  value={cardForm.draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    value={cardForm.draft.startTime}
                    onChange={(e) => updateDraft({ startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={cardForm.draft.endTime}
                    onChange={(e) => updateDraft({ endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Loại hoạt động:</label>
                <select
                  value={cardForm.draft.category}
                  onChange={(e) => updateDraft({ category: e.target.value as CardCategory })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="departure">Khởi hành tập trung</option>
                  <option value="ride">Đổ đèo / Di chuyển xe máy</option>
                  <option value="sight">Ngắm cảnh / Check-in</option>
                  <option value="food">Ăn uống / Cà phê ngắm mây</option>
                  <option value="fuel">Trạm xăng / Sửa xe</option>
                  <option value="camp">Cắm trại / Nghỉ đêm</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tốc độ chạy, điểm check-in hoặc ăn uống..."
                  value={cardForm.draft.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cung đường cụ thể:</label>
                <input
                  type="text"
                  placeholder="Vd: QL4C qua dốc Cán Tỷ"
                  value={cardForm.draft.routeNote || ''}
                  onChange={(e) => updateDraft({ routeNote: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Lưu ý trạm xăng:</label>
                <input
                  type="text"
                  placeholder="Vd: Đổ xăng tại ngã 3 Tam Sơn trước khi leo đèo"
                  value={cardForm.draft.gasStationAlert || ''}
                  onChange={(e) => updateDraft({ gasStationAlert: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cảnh báo an toàn đèo dốc:</label>
                <input
                  type="text"
                  placeholder="Vd: Cua tay áo gắt, dốc 12%, tránh rà phanh liên tục"
                  value={cardForm.draft.safetyWarning || ''}
                  onChange={(e) => updateDraft({ safetyWarning: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCardForm(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                >
                  {cardForm.id ? 'Lưu Thay Đổi' : 'Tạo Thẻ Chặng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Day Info Modal */}
      {dayForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveDayInfo}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                Ngày {currentDayIndex + 1} • {formatShortDate(currentDate)}
              </h3>
              <button type="button" onClick={() => setDayForm(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Chặng chính trong ngày:</label>
              <input
                type="text"
                placeholder="Vd: Hà Nội - Mai Châu - Mộc Châu"
                value={dayForm.routeTitle}
                onChange={(e) => setDayForm({ ...dayForm, routeTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Số km dự kiến:</label>
              <input
                type="number"
                min={0}
                value={dayForm.totalKm}
                onChange={(e) => setDayForm({ ...dayForm, totalKm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDayForm(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button type="submit" className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
