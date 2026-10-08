import { Trip } from '../types/trip';

/**
 * Quyền thao tác trên 1 tour của người dùng hiện tại.
 * Firestore rules (firestore.rules) áp dụng đúng các quy tắc này ở phía server.
 */
export interface TripPermissions {
  isLead: boolean;
  isActiveMember: boolean; // đang trong tour (chưa rời)
  hasLeft: boolean; // đã từng tham gia nhưng đã rời
  isActiveTrip: boolean; // tour chưa hoàn thành
  canEdit: boolean; // tour đang chạy + người dùng đang trong tour
  canUseAi: boolean; // chỉ Lead
  canLeave: boolean; // thành viên (không phải Lead) khi tour đang chạy
  canComplete: boolean; // chỉ Lead khi tour đang chạy
}

export function getTripPermissions(trip: Trip, userId: string): TripPermissions {
  const isLead = trip.createdBy === userId;
  const isActiveMember = trip.activeMemberIds.includes(userId);
  const hasLeft = !isActiveMember && trip.memberIds.includes(userId);
  const isActiveTrip = trip.status === 'active';
  const canEdit = isActiveTrip && isActiveMember;

  return {
    isLead,
    isActiveMember,
    hasLeft,
    isActiveTrip,
    canEdit,
    canUseAi: canEdit && isLead,
    canLeave: canEdit && !isLead,
    canComplete: canEdit && isLead,
  };
}

/** Tour đang chạy mà người dùng đang tham gia (mỗi người chỉ được ở 1 tour đang chạy) */
export function isUserInActiveTrip(trip: Trip, userId: string): boolean {
  return trip.status === 'active' && trip.activeMemberIds.includes(userId);
}

function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Danh sách ngày YYYY-MM-DD từ ngày đi tới ngày về (bao gồm 2 đầu) */
export function getTripDates(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "T7 20/10" */
export function formatShortDate(date: string): string {
  const d = parseDateOnly(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[d.getUTCDay()]} ${day}/${month}`;
}

/** "20/10/2026" */
export function formatDate(date: string): string {
  const d = parseDateOnly(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

/** "14:05 ngày 20/10" */
export function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ngày ${day}/${month}`;
}

/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD */
export function todayDateString(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Tổng km dự kiến của các ngày trong tour */
export function getTripTotalKm(trip: Trip): number {
  return getTripDates(trip.startDate, trip.endDate).reduce(
    (sum, date) => sum + (trip.dayInfo?.[date]?.totalKm || 0),
    0
  );
}
