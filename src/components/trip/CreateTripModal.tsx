import React, { useState } from 'react';
import { Trip, VehicleType } from '../../types/trip';
import { X, Plus, Bike, MapPin, Calendar, Sparkles } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (newTrip: Partial<Trip>) => void;
}

const COVER_PRESETS = [
  {
    label: 'Đèo cao hùng vĩ',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Cung đường ven biển',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Săn mây Tà Xùa',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Rừng thông Tây Bắc',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const [title, setTitle] = useState('');
  const [departure, setDeparture] = useState('Hà Nội');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [vehicle, setVehicle] = useState<VehicleType>('Côn tay (Winner X, Exciter, Raider)');
  const [vibe, setVibe] = useState('Chinh phục đèo dốc & Khám phá');
  const [coverImage, setCoverImage] = useState(COVER_PRESETS[0].url);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    onCreateTrip({
      title: title.trim(),
      departure: departure.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      defaultVehicle: vehicle,
      vibe: vibe.trim(),
      coverImage: coverImage.trim() || COVER_PRESETS[0].url,
    });

    setTitle('');
    setDestination('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tạo Chuyến Đi Mới</h3>
              <p className="text-[11px] text-slate-400">Bạn sẽ là Trưởng đoàn (Lead) của tour này</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Tên chuyến đi <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Vd: Hà Giang - Mã Pí Lèng Săn Mây Mùa Thu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Xuất phát
              </label>
              <input
                type="text"
                placeholder="Vd: Hà Nội, TP.HCM"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" /> Điểm đến <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Vd: Đồng Văn, Tà Xùa, Đà Lạt"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Ngày đi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Ngày về
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Bike className="w-3 h-3 text-amber-400" /> Xe di chuyển ưu tiên
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value as VehicleType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
            >
              <option value="Côn tay (Winner X, Exciter, Raider)">Côn tay (Winner X, Exciter, Raider)</option>
              <option value="Cào cào / Dual-Sport (CRF, XR, WR)">Cào cào / Dual-Sport (CRF, XR, WR)</option>
              <option value="Phân khối lớn ADV / Touring (CB500X, GS)">Phân khối lớn ADV / Touring (CB500X, GS)</option>
              <option value="Xe số (Wave, Future, Sirius)">Xe số (Wave, Future, Sirius)</option>
              <option value="Xe ga (AirBlade, NVX, SH)">Xe ga (AirBlade, NVX, SH)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" /> Phong cách chuyến đi
            </label>
            <input
              type="text"
              placeholder="Vd: Chinh phục đèo dốc & Săn mây, Camping hồ..."
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 text-xs"
            />
          </div>

          {/* Cover Photo Presets */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Ảnh bìa chuyến đi:</label>
            <div className="grid grid-cols-4 gap-2">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition ${
                    coverImage === preset.url ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !destination.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Khởi Tạo Chuyến Đi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
