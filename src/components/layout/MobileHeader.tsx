import React from 'react';
import { Trip, UserProfile } from '../../types/trip';
import { Compass, QrCode, Users, ChevronDown, Sparkles, Smartphone, ShieldCheck, Home, CheckCircle2, Clock, User } from 'lucide-react';

interface MobileHeaderProps {
  currentTrip: Trip | null;
  currentUser: UserProfile;
  isAtHome: boolean;
  onGoHome: () => void;
  onOpenProfile: () => void;
  onOpenTripSelector: () => void;
  onOpenInviteModal: () => void;
  onOpenArchitecture: () => void;
  deviceMode: 'iphone' | 'android' | 'full';
  setDeviceMode: (mode: 'iphone' | 'android' | 'full') => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentTrip,
  currentUser,
  isAtHome,
  onGoHome,
  onOpenProfile,
  onOpenTripSelector,
  onOpenInviteModal,
  onOpenArchitecture,
  deviceMode,
  setDeviceMode,
}) => {
  const isTripActive = currentTrip ? currentTrip.status === 'active' : false;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2 transition-all">
      {/* Top micro bar: user greeting & device mode switcher */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1.5 border-b border-slate-900/60 mb-2">
        <div className="flex items-center gap-1.5 font-medium text-orange-400">
          <Compass className="w-3.5 h-3.5" />
          <span>PHƯỢTMATE</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-orange-500/10 text-orange-300 border border-orange-500/30 rounded-full font-mono">
            v2.4
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* User profile button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-semibold transition"
            title="Tài khoản Google & Hồ sơ Biker"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-[9px] font-black">
                {(currentUser.name || currentUser.email || 'B').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="max-w-[75px] truncate">
              {currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.email ? currentUser.email.split('@')[0] : 'Biker')}
            </span>
          </button>

          <button
            onClick={() => setDeviceMode(deviceMode === 'iphone' ? 'android' : deviceMode === 'android' ? 'full' : 'iphone')}
            title="Đổi khung xem thiết bị di động"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <Smartphone className="w-3 h-3 text-slate-400" />
            <span className="capitalize">{deviceMode === 'full' ? 'Full' : deviceMode}</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium transition"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Store Spec</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="flex items-center justify-between gap-2">
        {isAtHome ? (
          /* When at Home: Show Home indicator & New trip quick action */
          <div className="flex-1 flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-wider">
                  Trang Chủ • Sổ Tour
                </div>
                <div className="text-[10px] text-slate-400">
                  Chào {currentUser.name} ({currentUser.email})
                </div>
              </div>
            </div>

            <button
              onClick={onOpenTripSelector}
              className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800"
            >
              <span>Đổi tour</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* When inside a specific tour: Show Back to Home & Current Trip Dropdown */
          <>
            <button
              onClick={onGoHome}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shrink-0"
              title="Về Trang chủ danh sách tour"
            >
              <Home className="w-4 h-4 text-orange-400" />
            </button>

            {/* Trip dropdown selector */}
            <button
              onClick={onOpenTripSelector}
              className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 text-left transition group min-w-0"
            >
              {currentTrip ? (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTripActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                    <span className="font-mono text-[10px] text-amber-400">#{currentTrip.inviteCode}</span>
                    <span className="text-slate-600">•</span>
                    <span className={`text-[10px] font-bold ${isTripActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isTripActive ? 'Đang diễn ra' : 'Đã hoàn thành'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {currentTrip.title}
                  </div>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-400">Chưa tham gia tour</div>
                  <div className="text-xs font-bold text-slate-300 truncate">
                    Chọn hoặc tạo chuyến đi mới
                  </div>
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition shrink-0" />
            </button>

            {/* Invite button */}
            {currentTrip && (
              <button
                onClick={onOpenInviteModal}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition shrink-0"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="text-[11px]">QR Mời</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
