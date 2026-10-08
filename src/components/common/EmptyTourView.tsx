import React from 'react';
import { Compass, Plus, LogIn, Calendar, Wallet, Sparkles, Bike, ArrowRight } from 'lucide-react';
import { Trip } from '../../types/trip';

interface EmptyTourViewProps {
  type: 'overview' | 'itinerary' | 'expenses' | 'ai';
  onOpenCreateTrip: () => void;
  onGoHome: () => void;
  pastTrips?: Trip[];
  onSelectPastTrip?: (tripId: string) => void;
}

export const EmptyTourView: React.FC<EmptyTourViewProps> = ({
  type,
  onOpenCreateTrip,
  onGoHome,
  pastTrips = [],
  onSelectPastTrip,
}) => {
  const getTabInfo = () => {
    switch (type) {
      case 'itinerary':
        return {
          icon: <Calendar className="w-10 h-10 text-orange-400" />,
          title: 'Chưa Có Lịch Trình',
          desc: 'Tài khoản của bạn chưa tham gia chuyến đi nào đang diễn ra. Khi tham gia tour, toàn bộ lộ trình từng chặng, cảnh báo đèo dốc và trạm xăng sẽ hiển thị tại đây.',
        };
      case 'expenses':
        return {
          icon: <Wallet className="w-10 h-10 text-emerald-400" />,
          title: 'Chưa Có Sổ Quỹ',
          desc: 'Bạn chưa ở trong chuyến đi nào. Sổ quỹ nhóm giúp tự động chia tiền từng bữa ăn, tiền xăng, miễn phí cho người đã thoát và tạo mã VietQR chuyển khoản nhanh.',
        };
      case 'ai':
        return {
          icon: <Sparkles className="w-10 h-10 text-purple-400" />,
          title: 'Chưa Có Reels AI',
          desc: 'Chưa có dữ liệu chuyến đi để dựng kịch bản video hoặc viết bài hành trình. Hãy tham gia hoặc tạo chuyến đi để khám phá tính năng này!',
        };
      default:
        return {
          icon: <Compass className="w-10 h-10 text-amber-400" />,
          title: 'Bạn Chưa Tham Gia Tour Nào',
          desc: 'Hiện tại bạn chưa tham gia chuyến đi nào đang diễn ra. Hãy tạo chuyến đi mới để trở thành Trưởng đoàn hoặc nhập mã mời từ đồng đội!',
        };
    }
  };

  const info = getTabInfo();

  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 space-y-6">
      {/* Icon Card */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl shadow-black/40 ring-4 ring-slate-800/40">
          {info.icon}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-400">
          <Bike className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Text Info */}
      <div className="max-w-xs space-y-2">
        <h3 className="text-base font-extrabold text-white tracking-tight">{info.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{info.desc}</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs space-y-2.5">
        <button
          onClick={onOpenCreateTrip}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Tạo Chuyến Đi Mới
        </button>

        <button
          onClick={onGoHome}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
        >
          Về Trang Chủ (Nhập Mã Mời)
        </button>
      </div>

      {/* Past Trips Accordion/List if user has previously participated in tours */}
      {pastTrips.length > 0 && onSelectPastTrip && (
        <div className="w-full max-w-sm pt-4 border-t border-slate-900 text-left space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Chuyến Đi Đã Từng Tham Gia ({pastTrips.length})
          </div>
          <div className="space-y-1.5">
            {pastTrips.map((pt) => (
              <button
                key={pt.id}
                onClick={() => onSelectPastTrip(pt.id)}
                className="w-full p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 flex items-center justify-between text-left transition group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-orange-400 truncate">
                    {pt.title}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{pt.destination}</span>
                    <span>•</span>
                    <span className={pt.status === 'completed' ? 'text-blue-400' : 'text-slate-400'}>
                      {pt.status === 'completed' ? 'Đã hoàn thành' : 'Đã rời tour'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
