import React, { useState } from 'react';
import { Trip } from '../../types/trip';
import { 
  MapPin, Calendar, Users, Bike, ShieldAlert, Sparkles, 
  CheckCircle2, Compass, ArrowRight, Wallet, Video, QrCode, Phone, Lock, Clock, Check, LogOut, AlertTriangle 
} from 'lucide-react';
import { UserProfile } from '../../types/trip';
import { formatVND } from '../../services/debtSimplifier';
import { CompleteTripModal } from './CompleteTripModal';

interface TripOverviewTabProps {
  trip: Trip;
  currentUser: UserProfile;
  onNavigateTab: (tab: 'itinerary' | 'story' | 'expenses' | 'architecture') => void;
  onOpenInvite: () => void;
  onOpenAiPlanner: () => void;
  onToggleTripStatus: (tripId: string) => void;
  onLeaveTrip?: (tripId: string) => void;
}

export const TripOverviewTab: React.FC<TripOverviewTabProps> = ({
  trip,
  currentUser,
  onNavigateTab,
  onOpenInvite,
  onOpenAiPlanner,
  onToggleTripStatus,
  onLeaveTrip,
}) => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalKm = trip.days.reduce((sum, d) => sum + d.totalKm, 0);
  const isCreator = trip.createdBy === currentUser.id;
  const isActive = trip.status === 'active';

  const currentUserMember = trip.members.find((m) => m.id === currentUser.id);
  const isUserActiveInTrip = currentUserMember && currentUserMember.status !== 'left';
  const hasUserLeftTrip = currentUserMember && currentUserMember.status === 'left';

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${minutes} ngày ${day}/${month}`;
    } catch {
      return iso;
    }
  };

  const handleConfirmLeave = () => {
    if (onLeaveTrip) {
      onLeaveTrip(trip.id);
    }
    setIsLeaveModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <div className="relative h-56 sm:h-64 w-full overflow-hidden">
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {/* Badges on Hero */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5">
              <span>Mã đoàn:</span>
              <span className="text-white tracking-wider">{trip.inviteCode}</span>
            </span>

            <button
              onClick={onOpenInvite}
              className="px-3 py-1 rounded-full bg-orange-500/90 hover:bg-orange-600 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Quét QR vào nhóm</span>
            </button>
          </div>

          {/* Bottom Title on Hero */}
          <div className="absolute bottom-3 left-3 right-3">
            <span className="px-2 py-0.5 rounded-md bg-orange-500/80 text-white text-[10px] font-bold uppercase tracking-wide">
              {trip.vibe || 'Phượt trải nghiệm'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 leading-tight drop-shadow-md">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {trip.departure} ➔ {trip.destination}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {trip.startDate} - {trip.endDate}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 divide-x divide-slate-800/80 bg-slate-950/90 py-2.5 px-2 border-t border-slate-800">
          <div className="text-center px-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Thời gian</div>
            <div className="text-sm font-black text-white">{trip.days.length} Ngày</div>
          </div>
          <div className="text-center px-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng chặng</div>
            <div className="text-sm font-black text-amber-400">{totalKm} Km</div>
          </div>
          <div className="text-center px-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Quân số</div>
            <div className="text-sm font-black text-white">{trip.members.length} Biker</div>
          </div>
          <div className="text-center px-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Quỹ đã chi</div>
            <div className="text-xs font-black text-emerald-400 truncate">
              {formatVND(totalExpense)}
            </div>
          </div>
        </div>

        {/* Tour Status & Creator Confirmation Banner */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isActive ? 'TOUR ĐANG DIỄN RA' : 'TOUR ĐÃ HOÀN THÀNH'}</span>
            </span>

            {isCreator && (
              <span className="text-[10px] text-orange-400 font-semibold hidden sm:inline">
                (Bạn là Người tạo)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Action button: creator only */}
            {isCreator && (
              <button
                onClick={() => {
                  if (isActive) {
                    setIsCompleteModalOpen(true);
                  } else {
                    onToggleTripStatus(trip.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận hoàn thành tour</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Kích hoạt lại tour</span>
                  </>
                )}
              </button>
            )}

            {/* Leave Tour Button for Active Participant */}
            {isUserActiveInTrip && (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5 active:scale-95 shadow"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Thoát Tour</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Left Notice Banner */}
      {hasUserLeftTrip && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-rose-500/30 text-xs text-slate-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-rose-300">Bạn đã rời chuyến đi này</div>
              <div className="text-[11px] text-slate-400">
                Thời gian rời tour: {formatDateTime(currentUserMember?.leftAt)}. Các khoản chi sau mốc này không tính cho bạn.
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-400 font-bold shrink-0">
            Lịch sử
          </span>
        </div>
      )}

      {/* 3 Main Action Tiles */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onOpenAiPlanner}
          className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/30 hover:border-orange-500/60 text-left transition group active:scale-95 flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-orange-300">
              AI Lên Lịch Trình
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gemini Flash đèo dốc</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('story')}
          className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/60 text-left transition group active:scale-95 flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 mb-2">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-purple-300">
              Kịch Bản Reels AI
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tạo từ 3-5 ảnh chụp</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('expenses')}
          className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition group active:scale-95 flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300">
              Chia Tiền VietQR
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bù trừ nợ 1 chạm</div>
          </div>
        </button>
      </div>

      {/* Fleet & Members */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Đội Hình Biker Trong Đoàn ({trip.members.length})
            </h2>
          </div>
          <button
            onClick={onOpenInvite}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
          >
            <span>+ Mời thêm</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {trip.members.map((member) => {
            const isLeft = member.status === 'left';

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                  isLeft
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500/80 to-amber-500/80 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                      {(member.name || 'B').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-xs">{member.name}</span>
                      {member.role.includes('Lead') && (
                        <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded text-[9px] font-bold">
                          LEAD
                        </span>
                      )}
                      {member.role.includes('Sweep') && (
                        <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded text-[9px] font-bold">
                          CHỐT
                        </span>
                      )}
                      {member.role.includes('Treasurer') && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold">
                          THỦ QUỸ
                        </span>
                      )}
                      {isLeft ? (
                        <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold">
                          ĐÃ RỜI TOUR
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-medium">
                          Đang chạy
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
                      <div>
                        Xe: <span className="text-slate-300 font-medium">{member.vehicle || 'Chưa cập nhật'}</span>
                      </div>
                      {isLeft && member.leftAt && (
                        <div className="text-[10px] text-rose-400/90">
                          Rời lúc: {formatDateTime(member.leftAt)}
                        </div>
                      )}
                      {!isLeft && member.joinedAt && (
                        <div className="text-[10px] text-slate-500">
                          Vào tour: {formatDateTime(member.joinedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isLeft && member.phone ? (
                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                    title={`Gọi cho ${member.name}: ${member.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Vehicle Technical Advice */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Lưu Ý Sinh Tồn & Kỹ Thuật Xe Máy
          </h2>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          {trip.vehicleAdvice ||
            'Kiểm tra áp suất lốp trước khi xuất phát. Khi đổ đèo dốc gắt, luôn giữ số thấp (số 2 hoặc số 3) để hãm động cơ, TUYỆT ĐỐI không bóp chặt phanh liên tục gây mất thắng nhiệt.'}
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-300 mb-2">Checklist Trang Bị Bắt Buộc:</h3>
          <div className="space-y-1.5">
            {(trip.gearChecklist || [
              'Giáp bảo hộ tay chân 4 món',
              'Mũ bảo hiểm đạt chuẩn 3/4 hoặc Fullface',
              'Bộ đồ nghề vá lốp xe máy mini + Bơm điện tử',
              'Áo mưa bộ cánh dơi cản gió lạnh',
              'Túi sơ cứu y tế cá nhân',
            ]).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Tour Confirmation Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Xác Nhận Thoát Tour?</h3>
                <p className="text-xs text-slate-400">Rời khỏi chuyến đi {trip.title}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                ⏱️ Thời điểm thoát tour sẽ được hệ thống ghi nhận chính xác vào lúc này.
              </p>
              <p className="text-emerald-400 font-semibold">
                🛡️ Quyền lợi chi phí: Những khoản chi phát sinh SAU khi bạn thoát tour sẽ KHÔNG tính cho bạn!
              </p>
              <p className="text-slate-400">
                📁 Dữ liệu lịch trình và sổ quỹ đã qua vẫn được lưu lại trong tài khoản của bạn để xem lại bất cứ lúc nào.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs"
              >
                Ở Lại Tour
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/30 transition text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Xác Nhận Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Confirmation Modal */}
      <CompleteTripModal
        isOpen={isCompleteModalOpen}
        trip={trip}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirmComplete={() => onToggleTripStatus(trip.id)}
        onNavigateToExpenses={() => onNavigateTab('expenses')}
      />
    </div>
  );
};
