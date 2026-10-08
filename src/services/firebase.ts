import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, 
  onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  collection, query, where, onSnapshot, getDocFromServer, getDocs 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Trip, UserProfile, Member } from '../types/trip';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (using the provisioned databaseId)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connected successfully.');
    return true;
  } catch (error: any) {
    console.log('Firestore connection check:', error?.message);
    return false;
  }
}

/**
 * Lấy hồ sơ người dùng từ Firestore (/users/{userId}) nếu đã từng lưu
 */
export async function getUserProfileFromFirestore(userId: string): Promise<Partial<UserProfile> | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserProfile>;
    }
    return null;
  } catch (e: any) {
    console.warn('Lấy user profile từ Firestore:', e?.message);
    return null;
  }
}

/**
 * Đăng nhập thật bằng Google (Firebase Auth GoogleAuthProvider)
 * Sync thông tin từ Google Account: displayName, email, photoURL, phone.
 * Các thông tin Biker chuyên biệt (xe máy, STK ngân hàng...) giữ trống nếu chưa thiết lập.
 */
export async function signInWithGoogleReal(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Lấy thông tin Biker từ Firestore nếu user đã từng lưu trước đó
    const existing = await getUserProfileFromFirestore(fbUser.uid);

    const userProfile: UserProfile = {
      id: fbUser.uid,
      // Sync chuẩn từ Google Account
      name: fbUser.displayName || existing?.name || fbUser.email?.split('@')[0] || '',
      email: fbUser.email || existing?.email || '',
      avatar: fbUser.photoURL || existing?.avatar || '',
      phone: existing?.phone || fbUser.phoneNumber || '',
      // Thông tin phượt thủ: nếu chưa có thì ĐỂ TRỐNG
      vehicle: existing?.vehicle || '',
      bankName: existing?.bankName || '',
      bankCode: existing?.bankCode || '',
      accountNumber: existing?.accountNumber || '',
      accountName: existing?.accountName || '',
      isLoggedIn: true,
      authProvider: 'google',
    };

    // Save/update user profile in Firestore
    await saveUserProfileToFirestore(userProfile);
    return userProfile;
  } catch (error: any) {
    console.warn('Google Popup login encountered an issue:', error);
    throw error;
  }
}

/**
 * Lắng nghe trạng thái đăng nhập Firebase Auth theo thời gian thực
 */
export function subscribeToAuthState(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const existing = await getUserProfileFromFirestore(fbUser.uid);
      const userProfile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || existing?.name || fbUser.email?.split('@')[0] || '',
        email: fbUser.email || existing?.email || '',
        avatar: fbUser.photoURL || existing?.avatar || '',
        phone: existing?.phone || fbUser.phoneNumber || '',
        vehicle: existing?.vehicle || '',
        bankName: existing?.bankName || '',
        bankCode: existing?.bankCode || '',
        accountNumber: existing?.accountNumber || '',
        accountName: existing?.accountName || '',
        isLoggedIn: true,
        authProvider: 'google',
      };
      onUserChanged(userProfile);
    } else {
      onUserChanged(null);
    }
  });
}

/**
 * Đồng bộ lại thông tin từ Google Account đang đăng nhập
 */
export async function resyncGoogleProfile(currentProfile: UserProfile): Promise<UserProfile> {
  const fbUser = auth.currentUser;
  if (!fbUser) return currentProfile;

  const updated: UserProfile = {
    ...currentProfile,
    name: fbUser.displayName || currentProfile.name || fbUser.email?.split('@')[0] || '',
    email: fbUser.email || currentProfile.email || '',
    avatar: fbUser.photoURL || currentProfile.avatar || '',
    phone: currentProfile.phone || fbUser.phoneNumber || '',
  };

  await saveUserProfileToFirestore(updated);
  return updated;
}

/**
 * Đăng xuất thật khỏi Firebase
 */
export async function signOutReal(): Promise<void> {
  await signOut(auth);
}

/**
 * Lưu hồ sơ người dùng vào Firestore (/users/{userId})
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('Lưu user profile vào Firestore:', e?.message);
  }
}

/**
 * Lắng nghe danh sách chuyến đi của người dùng thời gian thực (Realtime Firestore onSnapshot)
 * Chỉ trả về những tour mà người dùng là người tạo hoặc đã/đang tham gia
 */
export function subscribeToUserTrips(
  userId: string,
  onTripsUpdated: (trips: Trip[]) => void
): () => void {
  const tripsRef = collection(db, 'trips');

  // Lắng nghe realtime các chuyến đi
  const unsubscribe = onSnapshot(tripsRef, (snapshot) => {
    const userTrips: Trip[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Trip;
      const trip: Trip = {
        ...data,
        id: docSnap.id,
      };
      
      // User chỉ xem được thông tin tour mà họ đang hoặc đã tham gia (hoặc người tạo)
      const isMember = trip.members?.some((m) => m.id === userId);
      const isCreator = trip.createdBy === userId;
      if (isMember || isCreator) {
        userTrips.push(trip);
      }
    });

    onTripsUpdated(userTrips);
  }, (err) => {
    console.warn('Realtime Firestore trips listener status:', err?.message);
  });

  return unsubscribe;
}

/**
 * Loại bỏ các trường undefined để tránh lỗi Firestore Unsupported field value: undefined
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Lưu hoặc cập nhật chuyến đi lên Cloud Firestore
 */
export async function saveTripToFirestore(trip: Trip): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', trip.id);
    const memberIds = (trip.members || []).map((m) => m.id);

    const payload = sanitizeForFirestore({
      ...trip,
      memberIds,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(tripRef, payload, { merge: true });
    console.log('Đã đồng bộ chuyến đi lên Cloud Firestore:', trip.id);
  } catch (e) {
    console.error('Lỗi lưu trip vào Firestore:', e);
    throw e;
  }
}

/**
 * Tìm chuyến đi theo mã mời 6 ký tự
 */
export async function findTripByInviteCode(inviteCode: string): Promise<Trip | null> {
  try {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return null;
    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('inviteCode', '==', clean));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return {
      ...(docSnap.data() as Trip),
      id: docSnap.id,
    };
  } catch (e) {
    console.error('Lỗi tìm trip theo mã mời:', e);
    return null;
  }
}

/**
 * Tham gia chuyến đi trên Firestore bằng mã mời 6 ký tự
 */
export async function joinTripInFirestore(
  inviteCode: string,
  userProfile: UserProfile
): Promise<Trip | null> {
  try {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) return null;

    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('inviteCode', '==', cleanCode));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      console.warn('Không tìm thấy tour trên Firestore với mã mời:', cleanCode);
      return null;
    }

    const docSnap = querySnap.docs[0];
    const tripData = docSnap.data() as Trip;
    const currentMembers = tripData.members || [];
    const now = new Date().toISOString();

    // Check if member already exists in tour
    const existingIdx = currentMembers.findIndex((m) => m.id === userProfile.id);
    let updatedMembers: Member[];

    if (existingIdx === -1) {
      // Thành viên mới tham gia
      const newMember: Member = {
        id: userProfile.id,
        name: userProfile.name || userProfile.email?.split('@')[0] || 'Biker',
        avatar: userProfile.avatar || '',
        phone: userProfile.phone || '',
        role: 'Thành viên (Rider)',
        vehicle: userProfile.vehicle || '',
        bankName: userProfile.bankName || '',
        bankCode: userProfile.bankCode || '',
        accountNumber: userProfile.accountNumber || '',
        accountName: userProfile.accountName || '',
        status: 'active',
        joinedAt: now,
      };
      updatedMembers = [...currentMembers, newMember];
    } else {
      // Biker đã từng trong tour (có thể từng thoát tour, nay tham gia lại)
      updatedMembers = currentMembers.map((m, idx) => {
        if (idx === existingIdx) {
          const updated: Member = {
            ...m,
            status: 'active',
            joinedAt: now,
          };
          delete updated.leftAt;
          return updated;
        }
        return m;
      });
    }

    const memberIds = updatedMembers.map((m) => m.id);
    const updatePayload = sanitizeForFirestore({
      members: updatedMembers,
      memberIds,
      updatedAt: now,
    });

    await updateDoc(docSnap.ref, updatePayload);

    return {
      ...tripData,
      id: docSnap.id,
      members: updatedMembers,
    };
  } catch (e) {
    console.error('Lỗi khi join trip Firestore:', e);
    return null;
  }
}

/**
 * Thoát tour trên Firestore - Ghi nhận leftAt và chuyển status sang 'left'
 */
export async function leaveTripInFirestore(
  tripId: string,
  userId: string
): Promise<Trip | null> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) return null;

    const tripData = snap.data() as Trip;
    const now = new Date().toISOString();
    const updatedMembers = (tripData.members || []).map((m) => {
      if (m.id === userId) {
        return {
          ...m,
          status: 'left' as const,
          leftAt: now,
        };
      }
      return m;
    });

    const updatePayload = sanitizeForFirestore({
      members: updatedMembers,
      updatedAt: now,
    });

    await updateDoc(tripRef, updatePayload);

    return {
      ...tripData,
      id: tripId,
      members: updatedMembers,
    };
  } catch (e) {
    console.error('Lỗi khi thoát trip Firestore:', e);
    return null;
  }
}

/**
 * Cập nhật trạng thái hoàn thành tour trên Firestore (Chỉ người tạo)
 */
export async function updateTripStatusInFirestore(
  tripId: string,
  status: 'active' | 'completed',
  userId: string
): Promise<boolean> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) return false;

    const tripData = snap.data() as Trip;
    if (tripData.createdBy !== userId) {
      console.warn('Chỉ người tạo tour mới có quyền cập nhật trạng thái');
      return false;
    }

    const updatePayload = sanitizeForFirestore({
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(tripRef, updatePayload);
    return true;
  } catch (e) {
    console.error('Lỗi cập nhật status tour Firestore:', e);
    return false;
  }
}
