export type VehicleType = 
  | 'Xe số (Wave, Future, Sirius)'
  | 'Côn tay (Winner X, Exciter, Raider)'
  | 'Cào cào / Dual-Sport (CRF, XR, WR)'
  | 'Phân khối lớn ADV / Touring (CB500X, GS)'
  | 'Xe ga (AirBlade, NVX, SH)';

export type MemberRole = 'Trưởng đoàn (Lead)' | 'Chốt đoàn (Sweep)' | 'Thủ quỹ (Treasurer)' | 'Thành viên (Rider)';

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
  status?: 'active' | 'left'; // 'active' (đang trong tour) | 'left' (đã thoát tour)
  joinedAt?: string; // ISO timestamp e.g. 2026-10-07T10:00:00.000Z
  leftAt?: string; // ISO timestamp when member left the tour
}

export type CardCategory = 'departure' | 'ride' | 'sight' | 'food' | 'fuel' | 'camp' | 'stay';

export interface ItineraryCard {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  routeNote?: string;
  gasStationAlert?: string;
  safetyWarning?: string;
  category: CardCategory;
  isCompleted?: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  dateLabel: string;
  routeTitle: string;
  totalKm: number;
  cards: ItineraryCard[];
}

export type ExpenseCategory = 'Xăng cộ' | 'Ăn uống' | 'Chỗ ở' | 'Vé tham quan' | 'Sửa xe / Cứu hộ' | 'Khác';

export interface Expense {
  id: string;
  title: string;
  amount: number; // VNĐ
  category: ExpenseCategory;
  paidById: string; // Member ID who paid
  splitWithIds: string[]; // Member IDs sharing the expense
  date: string;
  createdAt?: string; // ISO timestamp
  note?: string;
}

export interface DebtSettlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  isSettled?: boolean;
}

export interface TripPhoto {
  id: string;
  url: string;
  caption?: string;
  base64?: string;
  mimeType?: string;
}

export interface ReelsScene {
  sceneNumber: number;
  timeRange: string;
  visual: string;
  voiceover: string;
  onScreenText: string;
}

export interface StoryAIResult {
  detectedThemes: string[];
  facebookPost: {
    title: string;
    hook: string;
    content: string;
    hashtags: string[];
  };
  reelsScript: {
    title: string;
    durationSeconds: number;
    recommendedMusic: string;
    hook3s: string;
    scenes: ReelsScene[];
    callToAction: string;
  };
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
  isLoggedIn: boolean;
  authProvider?: 'google' | 'apple' | 'email';
}

export interface Trip {
  id: string;
  title: string;
  inviteCode: string; // 6 characters
  departure: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  defaultVehicle: VehicleType;
  vibe: string;
  status: TripStatus; // 'active' (đang diễn ra) | 'completed' (đã hoàn thành)
  createdBy: string; // User ID của người tạo tour - người duy nhất có quyền xác nhận hoàn thành
  createdByName?: string;
  completedAt?: string;
  members: Member[];
  days: ItineraryDay[];
  expenses: Expense[];
  photos: TripPhoto[];
  aiStory?: StoryAIResult;
  gearChecklist?: string[];
  vehicleAdvice?: string;
}
