import { Member, Expense, DebtSettlement, Payment } from '../types/trip';

export interface MemberBalance {
  memberId: string;
  name: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = creditor, negative = debtor
}

/** Thành viên có vắng mặt tại thời điểm này không (đang rời tour, hoặc trong khoảng đã rời rồi vào lại) */
function isAbsentAt(member: Member, time: number): boolean {
  if (member.status === 'left' && member.leftAt) {
    const leftTime = new Date(member.leftAt).getTime();
    if (!isNaN(leftTime) && leftTime <= time) return true;
  }
  return (member.absences || []).some((a) => {
    const from = new Date(a.from).getTime();
    const to = new Date(a.to).getTime();
    return from <= time && time < to;
  });
}

/**
 * Thuật toán bù trừ nợ tối giản (Debt Simplification - Splitwise Greedy Algorithm)
 * Chuyển đổi ma trận nợ N-bên thành tối đa N-1 giao dịch chuyển khoản trực tiếp.
 * Các khoản đã thanh toán (payments) được trừ vào công nợ.
 */
export function calculateBalancesAndDebts(members: Member[], expenses: Expense[], payments: Payment[] = []): {
  balances: Record<string, MemberBalance>;
  settlements: DebtSettlement[];
  totalTripExpense: number;
} {
  const balances: Record<string, MemberBalance> = {};
  let totalTripExpense = 0;

  // Khởi tạo số dư ban đầu
  members.forEach(m => {
    balances[m.id] = {
      memberId: m.id,
      name: m.name,
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0,
    };
  });

  // Tính tổng tiền chi và phần nợ của từng thành viên
  expenses.forEach(exp => {
    totalTripExpense += exp.amount;

    // Người trả
    if (balances[exp.paidById]) {
      balances[exp.paidById].totalPaid += exp.amount;
    }

    // Thời điểm phát sinh khoản chi
    const expTime = new Date(exp.createdAt).getTime();

    // Lọc những thành viên hợp lệ cùng chia chi phí:
    // Biker vắng mặt (đã thoát tour) tại thời điểm khoản chi phát sinh sẽ KHÔNG bị tính chi phí này
    const validSplitIds = exp.splitWithIds.filter(id => {
      const member = members.find(m => m.id === id);
      if (!member) return false;
      return isNaN(expTime) || !isAbsentAt(member, expTime);
    });

    // Nếu tất cả người chia đều đã thoát tour, mặc định tính cho người trả
    const finalSplitIds = validSplitIds.length > 0
      ? validSplitIds
      : (balances[exp.paidById] ? [exp.paidById] : []);

    const splitCount = finalSplitIds.length;
    if (splitCount > 0) {
      const sharePerPerson = Math.round(exp.amount / splitCount);
      finalSplitIds.forEach(id => {
        if (balances[id]) {
          balances[id].totalShare += sharePerPerson;
        }
      });
    }
  });

  // Khoản đã chuyển khoản: người trả nợ được cộng, người nhận bị trừ
  payments.forEach(p => {
    if (balances[p.fromMemberId]) balances[p.fromMemberId].totalPaid += p.amount;
    if (balances[p.toMemberId]) balances[p.toMemberId].totalShare += p.amount;
  });

  // Tính Net Balance
  members.forEach(m => {
    balances[m.id].netBalance = balances[m.id].totalPaid - balances[m.id].totalShare;
  });

  // Tách ra Creditors (dương tiền) và Debtors (âm tiền)
  const creditors: { memberId: string; amount: number }[] = [];
  const debtors: { memberId: string; amount: number }[] = [];

  Object.values(balances).forEach(b => {
    const rounded = Math.round(b.netBalance);
    if (rounded > 500) {
      creditors.push({ memberId: b.memberId, amount: rounded });
    } else if (rounded < -500) {
      debtors.push({ memberId: b.memberId, amount: Math.abs(rounded) });
    }
  });

  // Sắp xếp giảm dần theo số tiền
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: DebtSettlement[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0) {
      settlements.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: settleAmount,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 500) {
      i++;
    }
    if (debtor.amount < 500) {
      j++;
    }
  }

  return { balances, settlements, totalTripExpense };
}

/**
 * Danh sách ngân hàng phổ biến tại Việt Nam (NAPAS 24/7)
 */
export const VIETNAM_BANKS = [
  { code: 'MB', name: 'MB Bank (Quân Đội)', bin: '970422' },
  { code: 'VCB', name: 'Vietcombank', bin: '970436' },
  { code: 'TCB', name: 'Techcombank', bin: '970407' },
  { code: 'ACB', name: 'ACB (Á Châu)', bin: '970416' },
  { code: 'VPB', name: 'VPBank', bin: '970432' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)', bin: '970423' },
  { code: 'BIDV', name: 'BIDV', bin: '970418' },
  { code: 'ICB', name: 'VietinBank', bin: '970415' },
  { code: 'VIB', name: 'VIB', bin: '970441' },
  { code: 'MSB', name: 'MSB (Hàng Hải)', bin: '970426' },
  { code: 'SHB', name: 'SHB', bin: '970443' },
];

/**
 * Tạo link VietQR chuẩn NAPAS 247
 * Hỗ trợ quét bằng mọi app Mobile Banking (VCB Digibank, MB Bank, Techcombank, MoMo...)
 */
export function generateVietQRUrl(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  memo: string;
}): string {
  const { bankCode, accountNumber, accountName, amount, memo } = params;
  const cleanBank = bankCode.toUpperCase().trim();
  const cleanAcc = accountNumber.trim();
  const encodedName = encodeURIComponent(accountName.trim());
  const encodedMemo = encodeURIComponent(memo.trim());

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedName}`;
}

/**
 * Chuỗi định dạng tiền tệ Việt Nam VNĐ
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
