import React, { useState } from 'react';
import { Trip, ItineraryCard, ItineraryDay, CardCategory } from '../../types/trip';
import { 
  Sparkles, Plus, Clock, MapPin, Fuel, ShieldAlert, CheckCircle2, 
  Circle, ChevronUp, ChevronDown, Trash2, Edit3, Bike, Coffee, 
  Camera, Tent, Utensils, AlertTriangle, X, Check, Compass 
} from 'lucide-react';

interface ItineraryViewProps {
  trip: Trip;
  onUpdateDays: (updatedDays: ItineraryDay[]) => void;
  onOpenAiPlanner: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  onUpdateDays,
  onOpenAiPlanner,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [editingCard, setEditingCard] = useState<{ dayIndex: number; card: ItineraryCard } | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Draft new card state
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newDescription, setNewDescription] = useState('');
  const [newRouteNote, setNewRouteNote] = useState('');
  const [newGasAlert, setNewGasAlert] = useState('');
  const [newSafetyWarning, setNewSafetyWarning] = useState('');
  const [newCategory, setNewCategory] = useState<CardCategory>('ride');

  const currentDay = trip.days[selectedDayIndex] || trip.days[0];

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

  // Reorder Card: Move Up
  const handleMoveUp = (cardIndex: number) => {
    if (cardIndex <= 0) return;
    const newDays = [...trip.days];
    const cards = [...newDays[selectedDayIndex].cards];
    const temp = cards[cardIndex - 1];
    cards[cardIndex - 1] = cards[cardIndex];
    cards[cardIndex] = temp;
    newDays[selectedDayIndex].cards = cards;
    onUpdateDays(newDays);
  };

  // Reorder Card: Move Down
  const handleMoveDown = (cardIndex: number) => {
    const cards = trip.days[selectedDayIndex].cards;
    if (cardIndex >= cards.length - 1) return;
    const newDays = [...trip.days];
    const newCards = [...cards];
    const temp = newCards[cardIndex + 1];
    newCards[cardIndex + 1] = newCards[cardIndex];
    newCards[cardIndex] = temp;
    newDays[selectedDayIndex].cards = newCards;
    onUpdateDays(newDays);
  };

  // Toggle Card completion
  const handleToggleCompleted = (cardIndex: number) => {
    const newDays = [...trip.days];
    const card = newDays[selectedDayIndex].cards[cardIndex];
    card.isCompleted = !card.isCompleted;
    onUpdateDays(newDays);
  };

  // Delete Card
  const handleDeleteCard = (cardIndex: number) => {
    if (confirm('Bạn chắc chắn muốn xóa thẻ chặng này?')) {
      const newDays = [...trip.days];
      newDays[selectedDayIndex].cards.splice(cardIndex, 1);
      onUpdateDays(newDays);
    }
  };

  // Create Card
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCard: ItineraryCard = {
      id: `card_${Date.now()}`,
      title: newTitle.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      description: newDescription.trim() || 'Chặng phượt trải nghiệm.',
      routeNote: newRouteNote.trim() || undefined,
      gasStationAlert: newGasAlert.trim() || undefined,
      safetyWarning: newSafetyWarning.trim() || undefined,
      category: newCategory,
      isCompleted: false,
    };

    const newDays = [...trip.days];
    newDays[selectedDayIndex].cards.push(newCard);
    onUpdateDays(newDays);

    // Reset draft
    setNewTitle('');
    setNewDescription('');
    setNewRouteNote('');
    setNewGasAlert('');
    setNewSafetyWarning('');
    setIsAddingCard(false);
  };

  // Save Edited Card
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    const newDays = [...trip.days];
    const idx = newDays[editingCard.dayIndex].cards.findIndex((c) => c.id === editingCard.card.id);
    if (idx !== -1) {
      newDays[editingCard.dayIndex].cards[idx] = editingCard.card;
      onUpdateDays(newDays);
    }
    setEditingCard(null);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Top AI Action Banner */}
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
              Nhập loại xe máy & điểm đến để sinh bộ Cards chuẩn đèo dốc
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

      {/* Days Tabs Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {trip.days.map((day, idx) => {
          const isActive = idx === selectedDayIndex;
          const completedCount = day.cards.filter((c) => c.isCompleted).length;

          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex flex-col items-start px-3.5 py-2 rounded-2xl border transition-all shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-102 font-bold'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <span>{day.dateLabel || `Ngày ${day.dayNumber}`}</span>
                {completedCount > 0 && (
                  <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-black/20 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                    {completedCount}/{day.cards.length}
                  </span>
                )}
              </div>
              <div className={`text-[10px] ${isActive ? 'text-orange-100' : 'text-slate-500'}`}>
                {day.totalKm} km
              </div>
            </button>
          );
        })}

        <button
          onClick={() => {
            const newDayNum = trip.days.length + 1;
            const newDays = [
              ...trip.days,
              {
                dayNumber: newDayNum,
                dateLabel: `Ngày ${newDayNum}`,
                routeTitle: `Chặng Ngày ${newDayNum}`,
                totalKm: 120,
                cards: [],
              },
            ];
            onUpdateDays(newDays);
            setSelectedDayIndex(trip.days.length);
          }}
          className="px-3 py-2 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-slate-400 hover:text-white text-xs font-medium shrink-0 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm ngày</span>
        </button>
      </div>

      {/* Current Day Header */}
      {currentDay && (
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
              {currentDay.dateLabel} • {currentDay.totalKm} km dự kiến
            </div>
            <h2 className="text-xs font-bold text-white truncate mt-0.5">
              {currentDay.routeTitle}
            </h2>
          </div>
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Thêm thẻ</span>
          </button>
        </div>
      )}

      {/* Cards List with Drag / Reorder Controls */}
      <div className="space-y-3">
        {currentDay && currentDay.cards.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-6 space-y-3">
            <Bike className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">Chưa có chặng nào trong ngày này</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Nhấn nút "Lập Lịch AI" để tự động sinh lịch trình xe máy hoặc thêm thẻ chặng thủ công.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={onOpenAiPlanner}
                className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Trợ Lý AI Lên Lịch
              </button>
              <button
                onClick={() => setIsAddingCard(true)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                + Thêm thủ công
              </button>
            </div>
          </div>
        ) : (
          currentDay?.cards.map((card, idx) => {
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
                      onClick={() => handleToggleCompleted(idx)}
                      className="text-slate-400 hover:text-emerald-400 transition"
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
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                      title="Chuyển lên trước"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === currentDay.cards.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                      title="Chuyển xuống sau"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCard({ dayIndex: selectedDayIndex, card: { ...card } })}
                      className="p-1 text-slate-400 hover:text-orange-400 transition"
                      title="Chỉnh sửa chặng"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      title="Xóa chặng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

      {/* Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Thêm Thẻ Chặng Mới</h3>
              <button onClick={() => setIsAddingCard(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tiêu đề chặng:</label>
                <input
                  type="text"
                  placeholder="Vd: Vượt đèo Mã Pí Lèng ngắm sông Nho Quế"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Loại hoạt động:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CardCategory)}
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
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cung đường cụ thể:</label>
                <input
                  type="text"
                  placeholder="Vd: QL4C qua dốc Cán Tỷ"
                  value={newRouteNote}
                  onChange={(e) => setNewRouteNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Lưu ý trạm xăng:</label>
                <input
                  type="text"
                  placeholder="Vd: Đổ xăng tại ngã 3 Tam Sơn trước khi leo đèo"
                  value={newGasAlert}
                  onChange={(e) => setNewGasAlert(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cảnh báo an toàn đèo dốc:</label>
                <input
                  type="text"
                  placeholder="Vd: Cua tay áo gắt, dốc 12%, tránh rà phanh liên tục"
                  value={newSafetyWarning}
                  onChange={(e) => setNewSafetyWarning(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                >
                  Tạo Thẻ Chặng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Chỉnh Sửa Thẻ Chặng</h3>
              <button onClick={() => setEditingCard(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tiêu đề chặng:</label>
                <input
                  type="text"
                  value={editingCard.card.title}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bắt đầu:</label>
                  <input
                    type="time"
                    value={editingCard.card.startTime}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, startTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kết thúc:</label>
                  <input
                    type="time"
                    value={editingCard.card.endTime}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, endTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả:</label>
                <textarea
                  rows={2}
                  value={editingCard.card.description}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Lưu ý trạm xăng:</label>
                <input
                  type="text"
                  value={editingCard.card.gasStationAlert || ''}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, gasStationAlert: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cảnh báo an toàn đèo dốc:</label>
                <input
                  type="text"
                  value={editingCard.card.safetyWarning || ''}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, safetyWarning: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
