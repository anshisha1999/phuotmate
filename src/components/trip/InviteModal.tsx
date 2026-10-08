import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Trip, Member } from '../../types/trip';
import { X, Copy, Check, Users, Share2, Phone, Lock } from 'lucide-react';

interface InviteModalProps {
  trip: Trip;
  members: Member[];
  canInvite: boolean; // tour đang chạy + người dùng đang trong tour
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  trip,
  members,
  canInvite,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Link mời: quét bằng camera điện thoại sẽ mở app và tự tham gia tour
  const inviteLink = `${window.location.origin}?invite=${trip.inviteCode}`;

  useEffect(() => {
    if (isOpen && canInvite) {
      QRCode.toDataURL(inviteLink, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, canInvite, inviteLink]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Mời Biker Vào Chuyến Đi</h3>
              <p className="text-xs text-slate-400">Đồng bộ lịch trình & sổ quỹ thời gian thực</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {canInvite ? (
            /* QR Code Container */
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 p-5 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                Quét mã QR bằng camera để vào đoàn
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-orange-500/30 mb-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Mã QR tham gia đoàn phượt"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400">
                    Đang tạo mã QR...
                  </div>
                )}
              </div>

              {/* 6-character invite code */}
              <div className="w-full">
                <p className="text-xs text-slate-400 mb-1">Hoặc nhập mã mời 6 ký tự:</p>
                <div className="flex items-center justify-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-widest px-2">
                    {trip.inviteCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-lg transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Share link button */}
              <div className="mt-3 flex gap-2 w-full">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã sao chép link' : 'Sao chép liên kết mời'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {trip.status === 'completed'
                  ? 'Tour đã hoàn thành, không thể mời thêm thành viên.'
                  : 'Bạn đã rời tour nên không thể mời thêm thành viên.'}
              </span>
            </div>
          )}

          {/* Members list */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
              Thành viên đang trong đoàn ({activeMembers.length})
            </h4>

            <div className="space-y-2">
              {activeMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500/80 to-amber-500/80 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                        {(m.name || 'B').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{m.name}</span>
                        {m.role.includes('Lead') && (
                          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-bold">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>🏍️ {m.vehicle || 'Chưa cập nhật xe'}</span>
                        {m.accountNumber && (
                          <>
                            <span>•</span>
                            <span>💳 {m.bankCode}: {m.accountNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                      title={`Gọi cho ${m.name}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
