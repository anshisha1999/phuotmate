import React, { useState } from 'react';
import { Trip } from '../../types/trip';
import type { ActionResult } from '../../App';
import { X, Plus, LogIn, MapPin, Check } from 'lucide-react';

interface TripSelectorModalProps {
  trips: Trip[];
  currentTripId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip: (tripId: string) => void;
  onOpenCreateTrip: () => void;
  onJoinTripByCode: (code: string) => Promise<ActionResult>;
}

export const TripSelectorModal: React.FC<TripSelectorModalProps> = ({
  trips,
  currentTripId,
  currentUserId,
  isOpen,
  onClose,
  onSelectTrip,
  onOpenCreateTrip,
  onJoinTripByCode,
}) => {
  const [mode, setMode] = useState<'list' | 'join'>('list');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const clean = joinCodeInput.trim().toUpperCase();
    if (clean.length !== 6) {
      setJoinError('Mã mời gồm 6 ký tự');
      return;
    }
    setIsJoining(true);
    const res = await onJoinTripByCode(clean);
    setIsJoining(false);
    if (!res.success) {
      setJoinError(res.message || 'Không tìm thấy chuyến đi với mã này');
      return;
    }
    setJoinCodeInput('');
    setMode('list');
    onClose();
  };

  const getStatusLabel = (trip: Trip) => {
    if (trip.status === 'completed') return { text: 'Đã hoàn thành', color: 'text-blue-400' };
    if (!trip.activeMemberIds.includes(currentUserId)) return { text: 'Đã rời tour', color: 'text-rose-400' };
    return { text: 'Đang diễn ra', color: 'text-emerald-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white text-base">
              {mode === 'list' ? 'Chuyến Đi Của Bạn' : 'Tham Gia Bằng Mã Mời'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'list' ? 'Chọn tour để xem lịch trình & chia tiền' : 'Nhập mã 6 ký tự từ trưởng đoàn'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3">
          {mode === 'list' && (
            <>
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateTrip();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo tour mới</span>
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Nhập mã vào đoàn</span>
                </button>
              </div>

              {/* Trip Cards list */}
              <div className="space-y-2.5">
                {trips.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-1">
                    <p className="font-semibold text-slate-300">Bạn chưa tham gia chuyến đi nào</p>
                    <p className="text-[11px] text-slate-500">
                      Bấm "Tạo tour mới" hoặc "Nhập mã vào đoàn" để bắt đầu chuyến đi đầu tiên!
                    </p>
                  </div>
                ) : (
                  trips.map((trip) => {
                    const isCurrent = trip.id === currentTripId;
                    const status = getStatusLabel(trip);
                    return (
                      <div
                        key={trip.id}
                        onClick={() => {
                          onSelectTrip(trip.id);
                          onClose();
                        }}
                        className={`relative overflow-hidden rounded-2xl border p-3 cursor-pointer transition-all ${
                          isCurrent
                            ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={trip.coverImage}
                            alt={trip.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">
                                #{trip.inviteCode}
                              </span>
                              {isCurrent && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
                                  <Check className="w-3.5 h-3.5" /> Đang xem
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-white text-xs truncate mb-1">
                              {trip.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                                {trip.destination}
                              </span>
                              <span>•</span>
                              <span className={status.color}>{status.text}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  NHẬP MÃ MỜI 6 KÝ TỰ:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ví dụ: HG8824"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono text-2xl font-black tracking-widest px-3 py-3 bg-slate-900 border-2 border-orange-500/50 rounded-xl text-amber-400 focus:outline-none focus:border-orange-500 uppercase placeholder:text-slate-600"
                  autoFocus
                />
                {joinError && (
                  <p className="text-xs text-red-400 mt-2 font-medium">{joinError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50"
                >
                  Vào chuyến đi
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
