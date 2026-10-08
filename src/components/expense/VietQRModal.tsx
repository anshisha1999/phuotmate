import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Member, DebtSettlement, Trip } from '../../types/trip';
import { formatVND, generateVietQRUrl } from '../../services/debtSimplifier';
import { X, Copy, Check, QrCode, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VietQRModalProps {
  settlement: DebtSettlement | null;
  fromMember: Member | null;
  toMember: Member | null;
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onToggleSettled: (fromId: string, toId: string) => void;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  settlement,
  fromMember,
  toMember,
  trip,
  isOpen,
  onClose,
  onToggleSettled,
}) => {
  const [offlineQrUrl, setOfflineQrUrl] = useState<string>('');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [useOfflineQr, setUseOfflineQr] = useState(false);

  if (!isOpen || !settlement || !fromMember || !toMember) return null;

  const memo = `PHUOTMATE ${trip.inviteCode} ${fromMember.name.slice(0, 10).toUpperCase()}`.replace(/[^a-zA-Z0-9 ]/g, '');

  const vietQrApiUrl = generateVietQRUrl({
    bankCode: toMember.bankCode || 'MB',
    accountNumber: toMember.accountNumber,
    accountName: toMember.accountName || toMember.name,
    amount: settlement.amount,
    memo: memo,
  });

  useEffect(() => {
    // Generate an EMVCo-like raw text QR as backup
    const rawQrText = `00020101021238540010A00000072701240006${toMember.bankCode}01${toMember.accountNumber}5303704540${settlement.amount}5802VN62${memo.length.toString().padStart(2, '0')}08${memo}6304`;
    
    QRCode.toDataURL(rawQrText, {
      width: 260,
      margin: 1,
      color: { dark: '#020617', light: '#ffffff' },
    })
      .then((url) => setOfflineQrUrl(url))
      .catch((err) => console.error(err));
  }, [settlement, toMember, memo]);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-sm">Mã VietQR Tiêu Chuẩn</h3>
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500 text-slate-950 font-black rounded uppercase">
                  NAPAS 247
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Quét thanh toán trực tiếp qua mọi Mobile Banking</p>
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
        <div className="p-4 overflow-y-auto space-y-3.5">
          {/* Transfer Relationship */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <img
                src={fromMember.avatar}
                alt={fromMember.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <div>
                <div className="text-[10px] text-slate-400">Người nợ</div>
                <div className="font-bold text-white truncate max-w-[80px]">{fromMember.name}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-bold text-amber-400">
                {formatVND(settlement.amount)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-[10px] text-slate-400">Người nhận</div>
                <div className="font-bold text-white truncate max-w-[80px]">{toMember.name}</div>
              </div>
              <img
                src={toMember.avatar}
                alt={toMember.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
            </div>
          </div>

          {/* Dynamic VietQR Container or Missing Bank Notice */}
          {toMember.accountNumber ? (
            <>
              <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center border-4 border-emerald-500/20">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  {!useOfflineQr ? (
                    <img
                      src={vietQrApiUrl}
                      alt="VietQR Chuyển Khoản"
                      className="w-full h-full object-contain"
                      onError={() => setUseOfflineQr(true)}
                    />
                  ) : (
                    offlineQrUrl && (
                      <img
                        src={offlineQrUrl}
                        alt="VietQR Offline"
                        className="w-full h-full object-contain"
                      />
                    )
                  )}
                </div>

                <div className="text-center mt-1">
                  <span className="text-[11px] font-extrabold text-slate-900 tracking-wider">
                    {toMember.bankName || toMember.bankCode} • {toMember.accountNumber}
                  </span>
                  <div className="text-[10px] text-slate-600 font-medium">
                    Chủ TK: {toMember.accountName || toMember.name.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Quick Copy Info Rows */}
              <div className="space-y-1.5 text-xs">
                {/* Account Number */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white">{toMember.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(toMember.accountNumber, setCopiedAcc)}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Sao chép STK"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Số tiền chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-400">{settlement.amount} đ</span>
                    <button
                      onClick={() => copyToClipboard(settlement.amount.toString(), setCopiedAmount)}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Sao chép số tiền"
                    >
                      {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Memo */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Nội dung CK:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-200 truncate max-w-[150px]">{memo}</span>
                    <button
                      onClick={() => copyToClipboard(memo, setCopiedMemo)}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Sao chép nội dung"
                    >
                      {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
              <div className="text-xs font-bold text-amber-300">
                Biker chưa cập nhật tài khoản ngân hàng
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white">{toMember.name}</strong> chưa điền STK ngân hàng trong hồ sơ Biker. Bạn có thể liên hệ trực tiếp hoặc thanh toán tiền mặt.
              </p>
              {toMember.phone && (
                <a
                  href={`tel:${toMember.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 hover:bg-slate-800"
                >
                  <span>Gọi cho {toMember.name}: {toMember.phone}</span>
                </a>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => {
                onToggleSettled(settlement.fromMemberId, settlement.toMemberId);
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Đã Thanh Toán Khoản Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
