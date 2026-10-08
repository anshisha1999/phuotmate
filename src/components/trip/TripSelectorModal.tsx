import React, { useState } from 'react';
import { Trip, VehicleType } from '../../types/trip';
import { X, Plus, LogIn, MapPin, Calendar, Check, Bike, Sparkles } from 'lucide-react';

interface TripSelectorModalProps {
  trips: Trip[];
  currentTripId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (newTrip: Partial<Trip>) => void;
  onJoinTripByCode: (code: string) => boolean | Promise<{ success: boolean; message?: string } | boolean>;
}

export const TripSelectorModal: React.FC<TripSelectorModalProps> = ({
  trips,
  currentTripId,
  isOpen,
  onClose,
  onSelectTrip,
  onCreateTrip,
  onJoinTripByCode,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // New trip form state
  const [title, setTitle] = useState('');
  const [departure, setDeparture] = useState('Hà Nội');
  const [destination, setDestination] = useState('Mã Pí Lèng, Hà Giang');
  const [startDate, setStartDate] = useState('2026-10-20');
  const [endDate, setEndDate] = useState('2026-10-23');
  const [vehicle, setVehicle] = useState<VehicleType>('Côn tay (Winner X, Exciter, Raider)');
  const [vibe, setVibe] = useState('Chinh phục đèo dốc & Săn mây');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80');

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const clean = joinCodeInput.trim().toUpperCase();
    if (clean.length < 4) {
      setJoinError('Mã mời tối thiểu 6 ký tự');
      return;
    }
    try {
      const res = await onJoinTripByCode(clean);
      if (typeof res === 'object' && res !== null) {
        if (!res.success) {
          setJoinError(res.message || 'Không tìm thấy chuyến đi với mã này hoặc bạn đã tham gia');
          return;
        }
      } else if (!res) {
        setJoinError('Không tìm thấy chuyến đi với mã này hoặc bạn đã tham gia');
        return;
      }
      setMode('list');
      onClose();
    } catch (err: any) {
      setJoinError(err?.message || 'Có lỗi xảy ra khi tham gia chuyến đi');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTrip({
      title: title.trim(),
      departure: departure.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      defaultVehicle: vehicle,
      vibe,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    });

    setTitle('');
    setMode('list');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white text-base">
              {mode === 'list' && 'Chuyến Đi Của Bạn'}
              {mode === 'create' && 'Tạo Chuyến Đi Mới'}
              {mode === 'join' && 'Tham Gia Bằng Mã Mời'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'list' && 'Chọn tour để xem lịch trình & chia tiền'}
              {mode === 'create' && 'Lên tour phượt cùng bạn đồng hành'}
              {mode === 'join' && 'Nhập mã 6 ký tự từ trưởng đoàn'}
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
                  onClick={() => setMode('create')}
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
                              <span>{trip.members.length} Biker</span>
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
                <div className="mt-3 text-xs text-slate-500">
                  Thử các mã mẫu: <span className="font-mono text-slate-400">HG8824</span> (Hà Giang), <span className="font-mono text-slate-400">TX6991</span> (Tà Xùa)
                </div>
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
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Vào chuyến đi
                </button>
              </div>
            </form>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Tên tour phượt:
                </label>
                <input
                  type="text"
                  placeholder="Vd: Y Tý Mùa Lúa Chín & Săn Mây"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Điểm xuất phát:
                  </label>
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Điểm đến chính:
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Ngày đi:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Ngày về:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Dòng xe máy chủ đạo:
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Xe số (Wave, Future, Sirius)">Xe số (Wave, Future, Sirius)</option>
                  <option value="Côn tay (Winner X, Exciter, Raider)">Côn tay (Winner X, Exciter, Raider)</option>
                  <option value="Cào cào / Dual-Sport (CRF, XR, WR)">Cào cào / Dual-Sport (CRF, XR, WR)</option>
                  <option value="Phân khối lớn ADV / Touring (CB500X, GS)">Phân khối lớn ADV / Touring (CB500X, GS)</option>
                  <option value="Xe ga (AirBlade, NVX, SH)">Xe ga (AirBlade, NVX, SH)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Phong cách chuyến đi:
                </label>
                <input
                  type="text"
                  placeholder="Vd: Săn mây, Camping ven suối, Thử thách đèo dốc..."
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Tạo & Lưu Tour
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
