import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/trip';
import { VIETNAM_BANKS } from '../../services/debtSimplifier';
import { X, Check, LogOut, User, Bike, CreditCard, ShieldCheck, Mail, RefreshCw, Sparkles } from 'lucide-react';

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onResyncGoogle?: () => Promise<void>;
  onLogout: () => void;
  onResetAllData?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateProfile,
  onResyncGoogle,
  onLogout,
  onResetAllData,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [vehicle, setVehicle] = useState(currentUser.vehicle || '');
  const [bankCode, setBankCode] = useState(currentUser.bankCode || '');
  const [accountNumber, setAccountNumber] = useState(currentUser.accountNumber || '');
  const [accountName, setAccountName] = useState(currentUser.accountName || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncSuccess, setResyncSuccess] = useState(false);

  // Synchronize state whenever currentUser or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setVehicle(currentUser.vehicle || '');
      setBankCode(currentUser.bankCode || '');
      setAccountNumber(currentUser.accountNumber || '');
      setAccountName(currentUser.accountName || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleResync = async () => {
    if (!onResyncGoogle) return;
    setIsResyncing(true);
    try {
      await onResyncGoogle();
      setResyncSuccess(true);
      setTimeout(() => setResyncSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResyncing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode);
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.email?.split('@')[0] || 'Biker',
      email: email.trim(),
      phone: phone.trim(),
      vehicle: vehicle.trim(),
      bankCode: bankCode.trim(),
      bankName: bankCode ? (selectedBank?.name || bankCode) : '',
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
    };

    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-base">Hồ Sơ Biker</h3>
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">
                  Google Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">Đồng bộ từ Google Account & Cá nhân hóa Biker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Current Google Account Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-500 shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-base border-2 border-orange-400 shadow">
                    {(currentUser.name || currentUser.email || 'B').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
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
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-sm">{currentUser.name || 'Biker'}</div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{currentUser.email}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium">
                  Tài khoản Google đã xác thực
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn đăng xuất khỏi tài khoản ${currentUser.email}?`)) {
                  onLogout();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold transition active:scale-95 text-xs"
              title="Đăng xuất khỏi tài khoản này"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>

          {/* Sync from Google Button */}
          {onResyncGoogle && (
            <button
              type="button"
              onClick={handleResync}
              disabled={isResyncing}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isResyncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ lại Họ tên & Ảnh từ tài khoản Google</span>
              </div>
              {resyncSuccess && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã cập nhật
                </span>
              )}
            </button>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                <Bike className="w-4 h-4 text-orange-400" />
                <span>Thông tin phượt thủ & Phương tiện</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Họ tên hiển thị trong tour:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lấy theo tên Google"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Số điện thoại liên hệ:
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống nếu chưa có"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Dòng xe máy chạy:
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống nếu chưa có"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Bank account for VietQR receiving */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Tài khoản nhận tiền tự động (VietQR NAPAS 247)</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ngân hàng thụ hưởng:</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Chưa chọn ngân hàng (Để trống) --</option>
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Số tài khoản (STK):</label>
                  <input
                    type="text"
                    placeholder="Để trống nếu chưa có"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full font-mono px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-emerald-500 font-bold placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tên chủ tài khoản:</label>
                  <input
                    type="text"
                    placeholder="Để trống nếu chưa có"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="w-full uppercase font-mono px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="flex-[2] py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Đã lưu thành công!</span>
                  </>
                ) : (
                  <span>Lưu Hồ Sơ Biker</span>
                )}
              </button>
            </div>

            {/* Clear cache / Reset option */}
            {onResetAllData && (
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khôi phục dữ liệu ban đầu và xóa toàn bộ Local Storage?')) {
                      onResetAllData();
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition underline"
                >
                  Xóa sạch bộ nhớ tạm & Khôi phục dữ liệu gốc
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
