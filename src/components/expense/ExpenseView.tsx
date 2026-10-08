import React, { useState } from 'react';
import { Trip, Expense, ExpenseCategory, Member, DebtSettlement, UserProfile } from '../../types/trip';
import { 
  calculateBalancesAndDebts, formatVND, VIETNAM_BANKS 
} from '../../services/debtSimplifier';
import { VietQRModal } from './VietQRModal';
import { 
  Plus, Wallet, QrCode, ArrowRight, CheckCircle2, Trash2, 
  Users, Fuel, Utensils, Home, Ticket, Wrench, MoreHorizontal, X, Check, AlertCircle 
} from 'lucide-react';

interface ExpenseViewProps {
  trip: Trip;
  currentUser?: UserProfile;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  trip,
  currentUser,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<DebtSettlement | null>(null);
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  // Active members who haven't left the tour
  const activeMembers = trip.members.filter((m) => m.status !== 'left');
  const userMember = currentUser ? trip.members.find((m) => m.id === currentUser.id) : null;
  const userHasLeft = userMember?.status === 'left';

  // Add Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(100000);
  const [category, setCategory] = useState<ExpenseCategory>('Ăn uống');
  const [paidById, setPaidById] = useState<string>(activeMembers[0]?.id || trip.members[0]?.id || '');
  const [splitMode, setSplitMode] = useState<'all' | 'single' | 'custom'>('all');
  const [singleMemberId, setSingleMemberId] = useState<string>(activeMembers[0]?.id || trip.members[0]?.id || '');
  const [splitWithIds, setSplitWithIds] = useState<string[]>(activeMembers.map((m) => m.id));
  const [note, setNote] = useState('');

  // Calculate balances & debt simplification (respects leftAt timestamps)
  const { balances, settlements, totalTripExpense } = calculateBalancesAndDebts(
    trip.members,
    trip.expenses
  );

  const perPersonAvg = activeMembers.length > 0 
    ? Math.round(totalTripExpense / activeMembers.length) 
    : (trip.members.length > 0 ? Math.round(totalTripExpense / trip.members.length) : 0);

  // Toggle member in split list
  const handleToggleSplitMember = (memberId: string) => {
    if (splitWithIds.includes(memberId)) {
      if (splitWithIds.length <= 1) return; // Keep at least one
      setSplitWithIds(splitWithIds.filter((id) => id !== memberId));
    } else {
      setSplitWithIds([...splitWithIds, memberId]);
    }
  };

  const handleSelectAllSplit = () => {
    if (splitWithIds.length === activeMembers.length) {
      setSplitWithIds([paidById]);
    } else {
      setSplitWithIds(activeMembers.map((m) => m.id));
    }
  };

  const handleOpenAddModal = () => {
    setSplitMode('all');
    setSplitWithIds(activeMembers.map((m) => m.id));
    setPaidById(activeMembers[0]?.id || trip.members[0]?.id || '');
    setSingleMemberId(activeMembers[0]?.id || trip.members[0]?.id || '');
    setIsAddModalOpen(true);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    let finalSplit: string[] = [];
    if (splitMode === 'all') {
      finalSplit = activeMembers.map((m) => m.id);
    } else if (splitMode === 'single') {
      finalSplit = [singleMemberId];
    } else {
      finalSplit = splitWithIds;
    }

    if (finalSplit.length === 0) {
      finalSplit = [paidById];
    }

    const nowIso = new Date().toISOString();
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      category,
      paidById,
      splitWithIds: finalSplit,
      date: nowIso,
      createdAt: nowIso,
      note: note.trim() || undefined,
    };

    onAddExpense(newExpense);
    setTitle('');
    setAmount(100000);
    setNote('');
    setIsAddModalOpen(false);
  };

  const handleToggleSettled = (fromId: string, toId: string) => {
    const key = `${fromId}_${toId}`;
    setSettledMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Xăng cộ':
        return <Fuel className="w-3.5 h-3.5 text-amber-400" />;
      case 'Ăn uống':
        return <Utensils className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Chỗ ở':
        return <Home className="w-3.5 h-3.5 text-blue-400" />;
      case 'Vé tham quan':
        return <Ticket className="w-3.5 h-3.5 text-purple-400" />;
      case 'Sửa xe / Cứu hộ':
        return <Wrench className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Top Ledger Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Sổ Quỹ & Chia Tiền Biker
              </h2>
              <span className="text-[11px] text-slate-400">Thuật toán tối giản nợ Splitwise & VietQR</span>
            </div>
          </div>

          {!userHasLeft && trip.status === 'active' && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Khoản Chi</span>
            </button>
          )}
        </div>

        {userHasLeft && (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="text-amber-400">ℹ️</span>
            <span>Bạn đã rời tour này. Các khoản chi phát sinh sau khi bạn rời tour sẽ không bị tính vào tài khoản của bạn.</span>
          </div>
        )}

        {/* Big Numbers */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng quỹ đã chi</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {formatVND(totalTripExpense)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Bình quân / biker đang chạy</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              {formatVND(perPersonAvg)}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DEBT SIMPLIFICATION & DYNAMIC VIETQR */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Bù Trừ Nợ Tối Giản ({settlements.length} Giao Dịch)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Triệt tiêu nợ vòng vèo ➔ Chuyển khoản ít nhất
          </span>
        </div>

        {settlements.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Quỹ đang hoàn toàn cân bằng! Chưa có khoản nợ nào cần thanh toán.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((settle, idx) => {
              const fromMember = trip.members.find((m) => m.id === settle.fromMemberId);
              const toMember = trip.members.find((m) => m.id === settle.toMemberId);
              const key = `${settle.fromMemberId}_${settle.toMemberId}`;
              const isSettled = settledMap[key];

              if (!fromMember || !toMember) return null;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSettled
                      ? 'bg-slate-950/50 border-slate-900 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {fromMember.avatar ? (
                        <img
                          src={fromMember.avatar}
                          alt={fromMember.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(fromMember.name || 'B').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-white truncate">{fromMember.name}</span>
                          <span className="text-slate-500">trả cho</span>
                          <span className="font-bold text-emerald-400 truncate">{toMember.name}</span>
                        </div>
                        <div className="font-mono text-sm font-black text-amber-400 mt-0.5">
                          {formatVND(settle.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSettled ? (
                        <button
                          onClick={() => handleToggleSettled(settle.fromMemberId, settle.toMemberId)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã trả</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedSettlement(settle)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>VietQR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Member Balances Pills */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">
            Số Dư Ròng Từng Thành Viên:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {Object.values(balances).map((b) => (
              <div
                key={b.memberId}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <span className="truncate text-slate-300 font-medium max-w-[90px]">{b.name}</span>
                <span
                  className={`font-mono text-[11px] font-bold ${
                    b.netBalance > 500
                      ? 'text-emerald-400'
                      : b.netBalance < -500
                      ? 'text-red-400'
                      : 'text-slate-400'
                  }`}
                >
                  {b.netBalance > 500
                    ? `+${formatVND(b.netBalance)}`
                    : b.netBalance < -500
                    ? `-${formatVND(Math.abs(b.netBalance))}`
                    : '0 đ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: REALTIME EXPENSE LOG */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Bảng Kê Chi Tiêu Lũy Kế ({trip.expenses.length} Khoản)
          </h3>
          <span className="text-[10px] text-slate-400">Thời gian thực</span>
        </div>

        {trip.expenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
            Chưa có khoản chi nào được ghi nhận. Bấm "+ Ghi Khoản Chi" để bắt đầu!
          </div>
        ) : (
          <div className="space-y-2">
            {trip.expenses.map((exp) => {
              const payer = trip.members.find((m) => m.id === exp.paidById);

              return (
                <div
                  key={exp.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{payer ? payer.name : 'Ẩn danh'} trả</span>
                        <span>•</span>
                        <span>Chia {exp.splitWithIds.length} người</span>
                        {exp.note && <span>• {exp.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-emerald-400">
                        {formatVND(exp.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">{exp.date}</div>
                    </div>

                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Xóa khoản chi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-h-[92vh] overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Ghi Nhận Khoản Chi Mới</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên khoản chi:</label>
                <input
                  type="text"
                  placeholder="Vd: Tiền xăng đèo, Lẩu gà lá é, Homestay..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Số tiền (VNĐ):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full font-mono text-base font-bold px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400"
                  required
                />
                {/* Quick add buttons */}
                <div className="flex gap-1.5 mt-1.5">
                  {[50000, 100000, 200000, 500000, 1000000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAmount(quick)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
                    >
                      +{quick / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Danh mục:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="Xăng cộ">Xăng cộ</option>
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Chỗ ở">Chỗ ở</option>
                    <option value="Vé tham quan">Vé tham quan</option>
                    <option value="Sửa xe / Cứu hộ">Sửa xe / Cứu hộ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Người trả tiền:</label>
                  <select
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Mode Selector (All, Single, Custom) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Chọn người chịu chi phí:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] mb-2">
                  <button
                    type="button"
                    onClick={() => setSplitMode('all')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition text-center ${
                      splitMode === 'all'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cả đoàn ({activeMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('single')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition text-center ${
                      splitMode === 'single'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Biker riêng
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('custom')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition text-center ${
                      splitMode === 'custom'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tùy chọn ({splitWithIds.length})
                  </button>
                </div>

                {/* Sub-view according to splitMode */}
                {splitMode === 'all' && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Chia đều cho tất cả <strong>{activeMembers.length}</strong> biker đang trong tour:</span>
                    <span className="font-mono font-bold text-amber-400">
                      ~{formatVND(Math.round(amount / (activeMembers.length || 1)))}/người
                    </span>
                  </div>
                )}

                {splitMode === 'single' && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400">Chọn 1 biker chịu 100% khoản chi này:</span>
                    <select
                      value={singleMemberId}
                      onChange={(e) => setSingleMemberId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    >
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.vehicle || 'Biker'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {splitMode === 'custom' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Đã chọn ({splitWithIds.length}/{activeMembers.length} biker):
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllSplit}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        {splitWithIds.length === activeMembers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                      {trip.members.map((m) => {
                        const isLeft = m.status === 'left';
                        const isChecked = splitWithIds.includes(m.id);

                        if (isLeft) {
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg opacity-40 bg-slate-900/40 text-slate-500 cursor-not-allowed"
                              title="Biker đã thoát tour, không thể tính chi phí phát sinh sau thời điểm thoát"
                            >
                              <div className="w-4 h-4 rounded border border-slate-800 bg-slate-950 flex items-center justify-center text-[10px]">
                                -
                              </div>
                              <span className="truncate text-[10px] line-through">{m.name} (Đã rời)</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleToggleSplitMember(m.id)}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition ${
                              isChecked ? 'bg-emerald-500/10 text-white' : 'text-slate-500'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate text-[11px]">{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ghi chú (tùy chọn):</label>
                <input
                  type="text"
                  placeholder="Vd: 4 suất cơm lam gà nướng..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl"
                >
                  Lưu Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic VietQR Modal */}
      {selectedSettlement && (
        <VietQRModal
          isOpen={!!selectedSettlement}
          settlement={selectedSettlement}
          fromMember={trip.members.find((m) => m.id === selectedSettlement.fromMemberId) || null}
          toMember={trip.members.find((m) => m.id === selectedSettlement.toMemberId) || null}
          trip={trip}
          onClose={() => setSelectedSettlement(null)}
          onToggleSettled={handleToggleSettled}
        />
      )}
    </div>
  );
};
