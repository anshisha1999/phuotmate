import React, { useState } from 'react';
import { Compass, Shield, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRealGoogleClick = async () => {
    setIsLoggingIn(true);
    setStatusNotice('Đang kết nối Firebase Auth và mở cửa sổ Google...');
    setErrorMessage('');
    try {
      await onLogin();
    } catch (err: any) {
      console.warn('Firebase popup status:', err?.code || err?.message || err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Cửa sổ đăng nhập bị trình duyệt chặn pop-up. Vui lòng cho phép mở pop-up và nhấn lại.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('Tên miền hiện tại chưa được phép đăng nhập. Hãy thêm tên miền này vào Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Không thể mở đăng nhập Google. Vui lòng thử lại!');
      }
    } finally {
      setIsLoggingIn(false);
      setStatusNotice('');
    }
  };

  return (
    <div className="min-h-[580px] p-6 flex flex-col justify-between text-center animate-in fade-in duration-300">
      {/* Top Brand Hero */}
      <div className="space-y-4 pt-6">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-400 p-0.5 shadow-2xl shadow-orange-500/30">
          <div className="w-full h-full bg-slate-950 rounded-3xl flex items-center justify-center">
            <Compass className="w-10 h-10 text-orange-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[9px] text-white font-bold items-center justify-center">
              AI
            </span>
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            PHƯỢTMATE
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
              Firebase Auth & Cloud Firestore
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono">
              Live BE
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
            Sổ phượt thông minh kết nối biker. Đăng nhập bằng tài khoản Google để đồng bộ lịch trình & sổ quỹ cá nhân của bạn theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Login Action Section */}
      <div className="space-y-3.5 py-4">
        {statusNotice && (
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            <span>{statusNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Real Google Login Button (Firebase Auth) */}
        <button
          onClick={handleRealGoogleClick}
          disabled={isLoggingIn}
          className="w-full py-4 px-4 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-extrabold text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Đăng nhập bằng tài khoản Google</span>
        </button>

        {/* Sync Rule Reminder */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Quy tắc đồng bộ tài khoản:</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            • Tên, Email, Ảnh đại diện được đồng bộ tự động từ Google Account.<br />
            • Hồ sơ Biker (dòng xe máy, số điện thoại, số tài khoản VietQR) được bảo mật và chỉnh sửa dễ dàng sau khi đăng nhập.
          </p>
        </div>
      </div>

      {/* Footer Security Badges */}
      <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cloud Firestore & Firebase Auth • Đồng Bộ Trực Tiếp</span>
        </div>
        <div>
          Dữ liệu tour và sổ quỹ được đồng bộ theo tài khoản Google thời gian thực.
        </div>
      </div>
    </div>
  );
};
