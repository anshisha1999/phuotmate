import React from 'react';
import { Trip } from '../../types/trip';
import { CheckCircle2, AlertTriangle, Wallet, Users, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatVND } from '../../services/debtSimplifier';

interface CompleteTripModalProps {
  isOpen: boolean;
  trip: Trip | null;
  onClose: () => void;
  onConfirmComplete: (tripId: string) => void;
  onNavigateToExpenses?: () => void;
}

export const CompleteTripModal: React.FC<CompleteTripModalProps> = ({
  isOpen,
  trip,
  onClose,
  onConfirmComplete,
  onNavigateToExpenses,
}) => {
  if (!isOpen || !trip) return null;

  const totalExpense = (trip.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const activeMembers = (trip.members || []).filter((m) => m.status !== 'left');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">
                Xác Nhận Hoàn Thành Tour
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {trip.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Main Notice Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Nhắc nhở quan trọng trước khi kết thúc tour:</span>
            </div>
            <ul className="text-[11px] text-amber-200/90 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Đảm bảo chi phí đã được thanh toán:</strong> Hãy kiểm tra kỹ <strong>Sổ Quỹ</strong> để chắc chắn các khoản đổ xăng, ăn uống, phòng nghỉ chung đã được nhập đủ và các biker đã chuyển khoản giải quyết công nợ.
              </li>
              <li>
                <strong>Bảo lưu dữ liệu:</strong> Sau khi hoàn thành, tour sẽ chuyển sang trạng thái kết thúc. Dữ liệu kỷ niệm, chi phí và lộ trình vẫn được lưu trữ nguyên vẹn để tất cả thành viên xem lại bất cứ lúc nào.
              </li>
            </ul>
          </div>

          {/* Tour Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Biker tham gia</span>
              </div>
              <div className="text-base font-black text-white">
                {activeMembers.length} <span className="text-xs font-normal text-slate-400">/ {trip.members.length}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tổng Quỹ Đã Chi</span>
              </div>
              <div className="text-sm font-black text-emerald-400 truncate">
                {formatVND(totalExpense)}
              </div>
            </div>
          </div>

          {/* Check Ledger Quick Link */}
          {onNavigateToExpenses && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToExpenses();
              }}
              className="w-full p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center justify-between text-xs font-semibold group"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Kiểm tra lại Sổ Quỹ & Công Nợ Biker</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition" />
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Thao tác này chỉ dành riêng cho Trưởng đoàn ({trip.createdByName || 'Người tạo'})</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmComplete(trip.id);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 active:scale-95 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác Nhận Hoàn Thành Tour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
