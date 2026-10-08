import React, { useState } from 'react';
import { VehicleType, ItineraryDay } from '../../types/trip';
import { requestAiTripPlan } from '../../services/api';
import { X, Sparkles, Bike, MapPin, Calendar, Compass, AlertCircle, Loader2 } from 'lucide-react';

interface AiPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeparture: string;
  currentDestination: string;
  currentVehicle: VehicleType;
  onApplyPlan: (data: {
    tripTitle: string;
    summary: string;
    vehicleAdvice: string;
    gearChecklist: string[];
    days: ItineraryDay[];
  }) => void;
}

export const AiPlannerModal: React.FC<AiPlannerModalProps> = ({
  isOpen,
  onClose,
  currentDeparture,
  currentDestination,
  currentVehicle,
  onApplyPlan,
}) => {
  const [departure, setDeparture] = useState(currentDeparture || 'Hà Nội');
  const [destination, setDestination] = useState(currentDestination || 'Mã Pí Lèng, Hà Giang');
  const [vehicleType, setVehicleType] = useState<VehicleType>(currentVehicle || 'Côn tay (Winner X, Exciter, Raider)');
  const [daysCount, setDaysCount] = useState<number>(3);
  const [vibe, setVibe] = useState('Chinh phục đèo dốc & Săn mây');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  if (!isOpen) return null;

  const quickRoutes = [
    { from: 'Hà Nội', to: 'Hà Giang - Mã Pí Lèng', days: 3, vehicle: 'Côn tay (Winner X, Exciter, Raider)' as VehicleType },
    { from: 'Hà Nội', to: 'Tà Xùa Săn Mây', days: 2, vehicle: 'Cào cào / Dual-Sport (CRF, XR, WR)' as VehicleType },
    { from: 'Sài Gòn', to: 'Đà Lạt qua Đèo Gia Bắc', days: 3, vehicle: 'Phân khối lớn ADV / Touring (CB500X, GS)' as VehicleType },
    { from: 'Đà Nẵng', to: 'Măng Đen - Kon Tum', days: 3, vehicle: 'Xe số (Wave, Future, Sirius)' as VehicleType },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 1200);

    try {
      const result = await requestAiTripPlan({
        departure,
        destination,
        vehicleType,
        daysCount,
        vibe,
        notes,
      });

      clearInterval(stepInterval);
      setIsLoading(false);
      onApplyPlan(result);
      onClose();
    } catch (error) {
      clearInterval(stepInterval);
      setIsLoading(false);
      alert('Không thể tạo lịch trình AI lúc này. Vui lòng thử lại!');
    }
  };

  const loadingMessages = [
    'Đang phân tích địa hình đèo dốc & độ cao...',
    'Đang kiểm tra trạm xăng tiếp tế & điểm cứu hộ...',
    'Đang tính toán thời gian di chuyển theo dòng xe ' + vehicleType.split('(')[0] + '...',
    'Đang đóng gói danh sách Card lịch trình an toàn...'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-base">Trợ Lý AI Lên Lịch Trình</h3>
                <span className="px-1.5 py-0.2 text-[9px] bg-orange-500 text-white font-black rounded uppercase">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Chuyên sâu xe máy: An toàn đèo dốc & Trạm xăng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
                <Bike className="w-7 h-7 text-orange-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Tour Leader AI Đang Lập Lịch Trình...</h4>
                <p className="text-xs text-orange-400 font-medium mt-1">
                  {loadingMessages[loadingStep]}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Tối ưu hoá các khúc cua tay áo, điểm đổ xăng và hạ trại trước khi trời tắt nắng.
              </p>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Gợi ý cung phượt hot:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickRoutes.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDeparture(r.from);
                        setDestination(r.to);
                        setDaysCount(r.days);
                        setVehicleType(r.vehicle);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition"
                    >
                      <div className="font-bold text-white text-[11px] truncate">{r.to}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{r.days} Ngày • {r.from}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure & Destination */}
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

              {/* Vehicle Type Selection */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Loại xe máy chạy tour:</span>
                  <span className="text-[10px] text-orange-400 font-normal">AI sẽ căn kỹ thuật phanh/xăng</span>
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="Xe số (Wave, Future, Sirius)">Xe số (Wave, Future, Sirius) - Phanh số, dốc khỏe</option>
                  <option value="Côn tay (Winner X, Exciter, Raider)">Côn tay (Winner X, Exciter) - Ghì máy dốc cao</option>
                  <option value="Cào cào / Dual-Sport (CRF, XR, WR)">Cào cào / Dual-Sport (CRF, XR) - Đi địa hình, sỏi đá</option>
                  <option value="Phân khối lớn ADV / Touring (CB500X, GS)">Phân khối lớn ADV / Touring (CB500X, GS) - Tải nặng, cua rộng</option>
                  <option value="Xe ga (AirBlade, NVX, SH)">Xe ga (AirBlade, NVX) - Lưu ý kỹ thuật phanh đổ đèo</option>
                </select>
              </div>

              {/* Days count & Vibe */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Thời lượng tour:
                  </label>
                  <select
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value={1}>1 Ngày (Chạy trong ngày)</option>
                    <option value={2}>2 Ngày 1 Đêm (Cuối tuần)</option>
                    <option value={3}>3 Ngày 2 Đêm (Tiêu chuẩn)</option>
                    <option value={4}>4 Ngày 3 Đêm (Trọn vẹn)</option>
                    <option value={5}>5 Ngày 4 Đêm (Xuyên tỉnh)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Gu trải nghiệm:
                  </label>
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Săn mây & Check-in hoàng hôn">Săn mây & Check-in hoàng hôn</option>
                    <option value="Chinh phục đèo dốc & Cua gắt">Chinh phục đèo dốc & Cua gắt</option>
                    <option value="Cắm trại ven suối hoang dã">Cắm trại ven suối hoang dã</option>
                    <option value="Khám phá văn hóa bản địa">Khám phá văn hóa bản địa</option>
                  </select>
                </div>
              </div>

              {/* Extra notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Yêu cầu thêm (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Vd: Không chạy đêm, muốn ăn thịt lợn bản, dừng ngắm lúa chín..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh Lịch Trình Tự Động</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
