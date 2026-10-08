import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, User as FirebaseUser
} from 'firebase/auth';
import {
  initializeFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, onSnapshot, writeBatch, arrayUnion, arrayRemove, deleteField, getDocsFromServer,
  serverTimestamp, Timestamp, DocumentReference
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Trip, UserProfile, ItineraryCard, Expense, Payment, DayInfo,
  LEAD_ROLE, RIDER_ROLE, MemberRole
} from '../types/trip';
import { getTripDates } from './tripRules';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (using the provisioned databaseId); bỏ qua field undefined khi ghi
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firebaseConfig.firestoreDatabaseId || undefined
);

/** Lỗi nghiệp vụ có thông điệp hiển thị được cho người dùng */
export class TripActionError extends Error {}

/** Thông điệp lỗi thân thiện cho người dùng */
export function describeFirebaseError(error: any, fallback: string): string {
  if (error instanceof TripActionError) return error.message;
  if (error?.code === 'permission-denied') {
    return 'Bạn không có quyền thực hiện thao tác này (tour đã hoàn thành, bạn đã rời tour hoặc không phải người tạo).';
  }
  if (error?.code === 'unavailable') {
    return 'Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }
  return fallback;
}

const nowIso = () => new Date().toISOString();

// ============ AUTH & USER PROFILE ============

/**
 * Đăng nhập thật bằng Google (Firebase Auth GoogleAuthProvider)
 */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

/**
 * Đăng xuất thật khỏi Firebase
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Lắng nghe trạng thái đăng nhập Firebase Auth theo thời gian thực
 */
export function subscribeToAuthState(onUserChanged: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, onUserChanged);
}

/**
 * Lấy hồ sơ Biker từ /users/{uid}, đồng bộ Tên/Email/Ảnh từ Google Account.
 * Các thông tin Biker chuyên biệt (xe máy, STK ngân hàng...) giữ trống nếu chưa thiết lập.
 */
export async function loadUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const snap = await getDoc(doc(db, 'users', fbUser.uid));
  const existing = snap.exists() ? (snap.data() as Partial<UserProfile>) : {};

  const profile: UserProfile = {
    id: fbUser.uid,
    name: existing.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Biker',
    email: fbUser.email || existing.email || '',
    avatar: fbUser.photoURL || existing.avatar || '',
    phone: existing.phone || fbUser.phoneNumber || '',
    vehicle: existing.vehicle || '',
    bankName: existing.bankName || '',
    bankCode: existing.bankCode || '',
    accountNumber: existing.accountNumber || '',
    accountName: existing.accountName || '',
  };

  if (!snap.exists()) {
    await saveUserProfile(profile);
  }
  return profile;
}

/**
 * Đồng bộ lại Họ tên & Ảnh từ Google Account đang đăng nhập
 */
export function applyGoogleAccountInfo(profile: UserProfile): UserProfile {
  const fbUser = auth.currentUser;
  if (!fbUser) return profile;
  return {
    ...profile,
    name: fbUser.displayName || profile.name,
    email: fbUser.email || profile.email,
    avatar: fbUser.photoURL || profile.avatar,
  };
}

/**
 * Lưu hồ sơ người dùng vào Firestore (/users/{userId})
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.id), { ...profile, updatedAt: nowIso() }, { merge: true });
}

/** ID token Firebase để gọi API server (AI) */
export async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new TripActionError('Vui lòng đăng nhập lại.');
  return user.getIdToken();
}

// ============ REALTIME SUBSCRIPTIONS ============

function toTrip(id: string, data: any): Trip | null {
  // Bỏ qua tour lưu theo định dạng cũ (trước khi tách thành viên/chi phí/lịch trình ra subcollection)
  if (!Array.isArray(data.activeMemberIds) || !Array.isArray(data.memberIds)) return null;
  return { ...data, id, dayInfo: data.dayInfo || {} } as Trip;
}

/**
 * Lắng nghe realtime các tour mà người dùng đang hoặc đã từng tham gia
 */
export function subscribeToUserTrips(
  userId: string,
  onTripsUpdated: (trips: Trip[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const trips = snapshot.docs
        .map((d) => toTrip(d.id, d.data()))
        .filter((t): t is Trip => t !== null)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onTripsUpdated(trips);
    },
    onError
  );
}

type TripSubcollection = 'members' | 'cards' | 'expenses' | 'payments';

/** Đổi mọi Timestamp (mốc thời gian do server ghi) thành chuỗi ISO cho phía giao diện */
function timestampsToIso(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(timestampsToIso);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, timestampsToIso(v)]));
  }
  return value;
}

/**
 * Lắng nghe realtime 1 subcollection của tour (thành viên, thẻ lịch trình, chi phí, thanh toán)
 */
export function subscribeToTripCollection<T extends { id: string }>(
  tripId: string,
  name: TripSubcollection,
  onUpdated: (items: T[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    collection(db, 'trips', tripId, name),
    (snapshot) =>
      onUpdated(
        snapshot.docs.map((d) => {
          // 'estimate': mốc thời gian server chưa xác nhận dùng giờ ước tính thay vì null
          const data = timestampsToIso(d.data({ serverTimestamps: 'estimate' }));
          if (name === 'members') {
            // absences lưu dạng map { [leftAtMillis]: { from, to } }
            data.absences = Object.values(data.absences || {});
          }
          return { ...data, id: d.id } as T;
        })
      ),
    onError
  );
}

// ============ TRIP LIFECYCLE ============

const tripRef = (tripId: string) => doc(db, 'trips', tripId);
const memberRef = (tripId: string, userId: string) => doc(db, 'trips', tripId, 'members', userId);
const inviteCodeRef = (code: string) => doc(db, 'inviteCodes', code);

function memberProfileFields(user: UserProfile) {
  return {
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
    vehicle: user.vehicle,
    bankName: user.bankName,
    bankCode: user.bankCode,
    accountNumber: user.accountNumber,
    accountName: user.accountName,
  };
}

/** Hồ sơ thành viên mới. joinedAt do server ghi (Firestore rules kiểm tra == request.time) */
function buildMember(user: UserProfile, role: MemberRole, inviteCode: string) {
  return {
    id: user.id,
    ...memberProfileFields(user),
    role,
    status: 'active',
    joinedAt: serverTimestamp(),
    joinedWithCode: inviteCode,
    absences: {},
  };
}

async function generateUniqueInviteCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await getDoc(inviteCodeRef(code));
    if (!existing.exists()) return code;
  }
  throw new TripActionError('Không tạo được mã mời. Vui lòng thử lại!');
}

export type TripInfoInput = Pick<
  Trip,
  'title' | 'departure' | 'destination' | 'startDate' | 'endDate' | 'defaultVehicle' | 'vibe' | 'coverImage'
>;

/**
 * Tạo tour mới - người tạo là Trưởng đoàn (Lead)
 */
export async function createTrip(input: TripInfoInput, user: UserProfile): Promise<string> {
  const code = await generateUniqueInviteCode();
  const newTripRef = doc(collection(db, 'trips'));
  const now = nowIso();

  const trip: Omit<Trip, 'id'> = {
    ...input,
    inviteCode: code,
    status: 'active',
    createdBy: user.id,
    createdByName: user.name,
    createdAt: now,
    memberIds: [user.id],
    activeMemberIds: [user.id],
    dayInfo: {},
    gearChecklist: [
      'Bộ giáp bảo hộ tay chân 4 món',
      'Mũ bảo hiểm đạt chuẩn 3/4 hoặc Fullface',
      'Bộ đồ nghề vá lốp xe máy mini',
      'Áo mưa bộ cản gió lạnh đèo',
      'Túi sơ cứu y tế',
    ],
    vehicleAdvice: 'Kiểm tra kỹ áp suất lốp xe và độ căng xích. Đổ đèo dốc gắt giữ số 2 hoặc 3 để hãm động cơ.',
  };

  const batch = writeBatch(db);
  batch.set(newTripRef, { ...trip, updatedAt: now });
  batch.set(inviteCodeRef(code), { tripId: newTripRef.id, createdBy: user.id, status: 'active' });
  batch.set(memberRef(newTripRef.id, user.id), buildMember(user, LEAD_ROLE, code));
  await batch.commit();
  return newTripRef.id;
}

/**
 * Tham gia tour bằng mã mời 6 ký tự. Chỉ tham gia (hoặc tham gia lại) được khi tour chưa hoàn thành.
 */
export async function joinTripByCode(inviteCode: string, user: UserProfile): Promise<string> {
  const code = inviteCode.trim().toUpperCase();
  const codeSnap = await getDoc(inviteCodeRef(code));
  if (!codeSnap.exists()) {
    throw new TripActionError('Không tìm thấy tour với mã mời này.');
  }
  const { tripId, status } = codeSnap.data() as { tripId: string; status: string };
  if (status !== 'active') {
    throw new TripActionError('Tour này đã hoàn thành, không thể tham gia.');
  }

  const existingSnap = await getDoc(memberRef(tripId, user.id));
  const batch = writeBatch(db);

  if (existingSnap.exists()) {
    const prev = existingSnap.data(); // dữ liệu gốc: leftAt là Timestamp
    if (prev.status === 'active') return tripId; // đã ở trong tour

    // Tham gia lại: lưu khoảng vắng mặt [leftAt, bây giờ) để không bị tính chi phí phát sinh trong lúc đã rời
    const leftAt = prev.leftAt;
    if (!(leftAt instanceof Timestamp)) {
      throw new TripActionError('Dữ liệu thành viên chưa đồng bộ xong. Vui lòng thử lại sau giây lát!');
    }
    batch.update(memberRef(tripId, user.id), {
      ...memberProfileFields(user),
      status: 'active',
      joinedAt: serverTimestamp(),
      joinedWithCode: code,
      leftAt: deleteField(),
      // Khóa = số mili-giây nguyên (Timestamp.toMillis() có thể có phần lẻ micro-giây)
      [`absences.${Math.floor(leftAt.toMillis())}`]: { from: leftAt, to: serverTimestamp() },
    });
  } else {
    batch.set(memberRef(tripId, user.id), buildMember(user, RIDER_ROLE, code));
  }

  batch.update(tripRef(tripId), {
    memberIds: arrayUnion(user.id),
    activeMemberIds: arrayUnion(user.id),
    updatedAt: nowIso(),
  });
  await batch.commit();
  return tripId;
}

/**
 * Thoát tour (chỉ thành viên, Trưởng đoàn không được thoát khi tour đang chạy)
 */
export async function leaveTrip(tripId: string, userId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(tripRef(tripId), { activeMemberIds: arrayRemove(userId), updatedAt: nowIso() });
  batch.update(memberRef(tripId, userId), { status: 'left', leftAt: serverTimestamp() });
  await batch.commit();
}

/**
 * Trưởng đoàn xác nhận hoàn thành tour - sau đó tour bị khóa chỉnh sửa vĩnh viễn
 */
export async function completeTrip(trip: Trip): Promise<void> {
  const now = nowIso();
  const batch = writeBatch(db);
  batch.update(tripRef(trip.id), { status: 'completed', completedAt: now, updatedAt: now });
  batch.update(inviteCodeRef(trip.inviteCode), { status: 'completed' });
  await batch.commit();
}

// Mỗi thao tác ghi thẻ/chi phí làm Firestore rules đọc lại tour (giới hạn 20 lượt đọc / batch)
const RULE_CHECKED_BATCH_SIZE = 15;

/** Xóa nhiều document, chia thành nhiều batch nhỏ */
async function deleteDocsInChunks(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += RULE_CHECKED_BATCH_SIZE) {
    const batch = writeBatch(db);
    refs.slice(i, i + RULE_CHECKED_BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/** Số thẻ lịch trình (đọc mới nhất từ server) nằm ngoài khoảng ngày mới - dùng để cảnh báo trước khi đổi ngày */
export async function countCardsOutsideDates(tripId: string, startDate: string, endDate: string): Promise<number> {
  const newDates = new Set(getTripDates(startDate, endDate));
  const cardsSnap = await getDocsFromServer(cardsCollection(tripId));
  return cardsSnap.docs.filter((d) => !newDates.has(d.data().date)).length;
}

/**
 * Trưởng đoàn cập nhật thông tin tour. Khi rút ngắn ngày, xóa dữ liệu lịch trình của các ngày ngoài khoảng mới.
 */
export async function updateTripInfo(trip: Trip, input: TripInfoInput): Promise<void> {
  const newDates = new Set(getTripDates(input.startDate, input.endDate));

  // Đọc lại từ server để không sót thẻ vừa được thành viên khác thêm
  const cardsSnap = await getDocsFromServer(cardsCollection(trip.id));
  await deleteDocsInChunks(cardsSnap.docs.filter((d) => !newDates.has(d.data().date)).map((d) => d.ref));

  const update: Record<string, unknown> = { ...input, updatedAt: nowIso() };
  Object.keys(trip.dayInfo)
    .filter((date) => !newDates.has(date))
    .forEach((date) => {
      update[`dayInfo.${date}`] = deleteField();
    });
  await updateDoc(tripRef(trip.id), update);
}

/**
 * Cập nhật hồ sơ của mình trong tour đang tham gia
 */
export async function updateMemberProfile(tripId: string, user: UserProfile): Promise<void> {
  await updateDoc(memberRef(tripId, user.id), memberProfileFields(user));
}

// ============ ITINERARY ============

const cardsCollection = (tripId: string) => collection(db, 'trips', tripId, 'cards');

export async function addCard(tripId: string, card: Omit<ItineraryCard, 'id'>): Promise<void> {
  await setDoc(doc(cardsCollection(tripId)), card);
}

export async function updateCard(
  tripId: string,
  cardId: string,
  patch: Partial<Omit<ItineraryCard, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId, 'cards', cardId), patch);
}

export async function deleteCard(tripId: string, cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', tripId, 'cards', cardId));
}

/** Đổi thứ tự 2 thẻ trong cùng 1 ngày */
export async function swapCardOrder(tripId: string, a: ItineraryCard, b: ItineraryCard): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId, 'cards', a.id), { order: b.order });
  batch.update(doc(db, 'trips', tripId, 'cards', b.id), { order: a.order });
  await batch.commit();
}

export async function updateDayInfo(tripId: string, date: string, info: DayInfo): Promise<void> {
  await updateDoc(tripRef(tripId), { [`dayInfo.${date}`]: info, updatedAt: nowIso() });
}

export interface AiPlanResult {
  dayInfo: Record<string, DayInfo>;
  cards: Omit<ItineraryCard, 'id'>[];
  gearChecklist: string[];
  vehicleAdvice: string;
}

/**
 * Áp dụng lịch trình AI: RESET toàn bộ lịch trình hiện tại (xóa mọi thẻ) rồi ghi lịch trình mới
 */
export async function replaceItineraryWithAiPlan(tripId: string, plan: AiPlanResult): Promise<void> {
  // Đọc lại từ server để xóa cả thẻ vừa được thành viên khác thêm trong lúc AI đang chạy
  const existingCards = await getDocsFromServer(cardsCollection(tripId));
  await deleteDocsInChunks(existingCards.docs.map((c) => c.ref));

  for (let i = 0; i < plan.cards.length; i += RULE_CHECKED_BATCH_SIZE) {
    const batch = writeBatch(db);
    plan.cards.slice(i, i + RULE_CHECKED_BATCH_SIZE).forEach((c) => batch.set(doc(cardsCollection(tripId)), c));
    await batch.commit();
  }

  await updateDoc(tripRef(tripId), {
    dayInfo: plan.dayInfo,
    gearChecklist: plan.gearChecklist,
    vehicleAdvice: plan.vehicleAdvice,
    updatedAt: nowIso(),
  });
}

// ============ EXPENSES & PAYMENTS ============

/** createdAt do server ghi (Firestore rules kiểm tra == request.time) - là mốc tính chi phí cho thành viên */
export async function addExpense(tripId: string, expense: Omit<Expense, 'id' | 'createdAt'>): Promise<void> {
  await setDoc(doc(collection(db, 'trips', tripId, 'expenses')), { ...expense, createdAt: serverTimestamp() });
}

/** Chỉ người tạo khoản chi được sửa (Firestore rules kiểm tra createdBy) */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  patch: Pick<Expense, 'title' | 'amount' | 'category' | 'paidById' | 'splitWithIds' | 'note'>
): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), {
    ...patch,
    note: patch.note ?? deleteField(),
  });
}

/** Chỉ người tạo khoản chi được xóa */
export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
}

/** Ghi nhận đã chuyển khoản trả nợ (người trả hoặc người nhận xác nhận) */
export async function addPayment(tripId: string, payment: Omit<Payment, 'id' | 'createdAt'>): Promise<void> {
  await setDoc(doc(collection(db, 'trips', tripId, 'payments')), { ...payment, createdAt: serverTimestamp() });
}

/** Hủy ghi nhận thanh toán (chỉ người đã ghi nhận) */
export async function deletePayment(tripId: string, paymentId: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', tripId, 'payments', paymentId));
}
