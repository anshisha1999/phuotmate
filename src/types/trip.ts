export type VehicleType =
  | 'Xe số (Wave, Future, Sirius)'
  | 'Côn tay (Winner X, Exciter, Raider)'
  | 'Cào cào / Dual-Sport (CRF, XR, WR)'
  | 'Phân khối lớn ADV / Touring (CB500X, GS)'
  | 'Xe ga (AirBlade, NVX, SH)';

export type MemberRole = 'Trưởng đoàn (Lead)' | 'Thành viên (Rider)';

export const LEAD_ROLE: MemberRole = 'Trưởng đoàn (Lead)';
export const RIDER_ROLE: MemberRole = 'Thành viên (Rider)';

// Khoảng thời gian thành viên vắng mặt (đã rời rồi vào lại) - không chịu chi phí phát sinh trong khoảng này
export interface Absence {
  from: string; // ISO
  to: string; // ISO
}

/** /trips/{tripId}/members/{userId} */
export interface Member {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  role: MemberRole;
  vehicle: string;
  bankName: string;
  bankCode: string; // e.g. VCB, TCB, MB, VPB, TPB, ACB, BIDV
  accountNumber: string;
  accountName: string;
  status: 'active' | 'left'; // 'active' (đang trong tour) | 'left' (đã thoát tour)
  joinedAt: string; // ISO timestamp lần vào tour gần nhất
  leftAt?: string; // ISO timestamp khi đang ở trạng thái 'left'
  absences?: Absence[];
}

export type CardCategory = 'departure' | 'ride' | 'sight' | 'food' | 'fuel' | 'camp' | 'stay';

/** /trips/{tripId}/cards/{cardId} - mỗi thẻ chặng gắn với 1 ngày cụ thể */
export interface ItineraryCard {
  id: string;
  date: string; // YYYY-MM-DD
  order: number; // thứ tự trong ngày
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  routeNote?: string;
  gasStationAlert?: string;
  safetyWarning?: string;
  category: CardCategory;
  isCompleted: boolean;
  createdBy: string;
  createdAt: string;
}

export interface DayInfo {
  routeTitle: string;
  totalKm: number;
}

export type ExpenseCategory = 'Xăng cộ' | 'Ăn uống' | 'Chỗ ở' | 'Vé tham quan' | 'Sửa xe / Cứu hộ' | 'Khác';

/** /trips/{tripId}/expenses/{expenseId} */
export interface Expense {
  id: string;
  title: string;
  amount: number; // VNĐ
  category: ExpenseCategory;
  paidById: string; // Member ID who paid
  splitWithIds: string[]; // Member IDs sharing the expense
  createdAt: string; // ISO timestamp - mốc tính chi phí cho thành viên
  createdBy: string; // Chỉ người tạo được sửa/xóa
  note?: string;
}

/** /trips/{tripId}/payments/{paymentId} - Ghi nhận đã chuyển khoản trả nợ */
export interface Payment {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface DebtSettlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export type TripStatus = 'active' | 'completed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  vehicle: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

/** /trips/{tripId} */
export interface Trip {
  id: string;
  title: string;
  inviteCode: string; // 6 characters
  departure: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  coverImage: string;
  defaultVehicle: VehicleType;
  vibe: string;
  status: TripStatus; // 'active' (đang diễn ra) | 'completed' (đã hoàn thành - khóa chỉnh sửa)
  createdBy: string; // User ID của Trưởng đoàn - người duy nhất có quyền xác nhận hoàn thành
  createdByName: string;
  createdAt: string;
  completedAt?: string;
  memberIds: string[]; // Tất cả người đã từng tham gia (được xem tour)
  activeMemberIds: string[]; // Người đang trong tour (được thao tác)
  dayInfo: Record<string, DayInfo>; // key = YYYY-MM-DD
  gearChecklist?: string[];
  vehicleAdvice?: string;
}

/** Dữ liệu chi tiết của tour đang xem (các subcollection) */
export interface TripDetails {
  members: Member[];
  cards: ItineraryCard[];
  expenses: Expense[];
  payments: Payment[];
}
