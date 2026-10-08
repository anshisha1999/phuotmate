import React from 'react';
import { UserProfile } from '../../types/trip';
import { Compass } from 'lucide-react';

interface MobileHeaderProps {
  currentUser: UserProfile;
  onOpenProfile: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentUser,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2 transition-all">
      {/* Top bar: logo & user profile */}
      <div className="flex items-center justify-between text-xs text-slate-400">
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
        </div>
      </div>
    </header>
  );
};
