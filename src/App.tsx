import React, { useState, useEffect, useMemo } from 'react';
import { Trip, UserProfile, Member, Expense, ItineraryDay } from './types/trip';
import { DEFAULT_CURRENT_USER, INITIAL_TRIPS } from './data/mockTrips';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { TripOverviewTab } from './components/trip/TripOverviewTab';
import { ItineraryView } from './components/itinerary/ItineraryView';
import { ExpenseView } from './components/expense/ExpenseView';
import { StorytellerView } from './components/story/StorytellerView';
import { StoreArchitectureView } from './components/docs/StoreArchitectureModal';
import { HomeView } from './components/home/HomeView';
import { EmptyTourView } from './components/common/EmptyTourView';
import { CreateTripModal } from './components/trip/CreateTripModal';
import { TripSelectorModal } from './components/trip/TripSelectorModal';
import { InviteModal } from './components/trip/InviteModal';
import { AiPlannerModal } from './components/itinerary/AiPlannerModal';
import { AuthModal } from './components/auth/AuthModal';
import { CompleteTripModal } from './components/trip/CompleteTripModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { 
  testFirestoreConnection, signInWithGoogleReal, signOutReal, 
  saveTripToFirestore, subscribeToUserTrips, saveUserProfileToFirestore,
  updateTripStatusInFirestore, getUserProfileFromFirestore,
  subscribeToAuthState, resyncGoogleProfile, leaveTripInFirestore,
  joinTripInFirestore 
} from './services/firebase';
import { Wifi, Battery, Signal } from 'lucide-react';

const TRIPS_STORAGE_KEY = 'phuotmate_trips_data_v4';
const USER_STORAGE_KEY = 'phuotmate_user_profile_v4';

export default function App() {
  // 1. Current Logged-in User
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CURRENT_USER;
  });

  // 2. Trips Data (Khởi tạo sạch không mock)
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(TRIPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Trip[];
        // Lọc bỏ bất kỳ trip nháp cũ nào
        return parsed.filter(t => t.id !== 'trip-ha-giang-2026' && t.id !== 'trip-ta-xua-2026');
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [currentTripId, setCurrentTripId] = useState<string>('');

  // Default landing tab is 'home' (Trang chủ)
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [deviceMode, setDeviceMode] = useState<'iphone' | 'android' | 'full'>('iphone');

  // Modals state
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [isTripSelectorOpen, setIsTripSelectorOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAiPlannerOpen, setIsAiPlannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [tripToConfirmComplete, setTripToConfirmComplete] = useState<Trip | null>(null);

  // Lắng nghe param ?invite= hoặc ?code= từ link chia sẻ
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get('invite') || params.get('code');
      if (inviteParam) {
        const cleanCode = inviteParam.trim().toUpperCase();
        sessionStorage.setItem('phuotmate_pending_invite', cleanCode);
      }
    } catch (e) {
      console.warn('URL search parse:', e);
    }
  }, []);

  // Danh sách tour gắn với tài khoản của người dùng (chỉ người tạo hoặc người đã/đang tham gia)
  const userTrips = useMemo(() => {
    if (!currentUser.id) return [];
    return trips.filter((t) => 
      t.createdBy === currentUser.id || 
      t.members?.some((m) => m.id === currentUser.id)
    );
  }, [trips, currentUser.id]);

  // Tour đang diễn ra mà người dùng chưa thoát
  const userActiveTrip = useMemo(() => {
    if (!currentUser.id) return null;
    return userTrips.find((t) => 
      t.status === 'active' && 
      t.members?.some((m) => m.id === currentUser.id && m.status !== 'left')
    );
  }, [userTrips, currentUser.id]);

  // Chuyến đi hiện đang được chọn xem (nếu có tour đang chạy thì mặc định chọn tour đang chạy, trừ khi người dùng chủ động chọn tour khác từ lịch sử)
  const currentTrip = useMemo(() => {
    if (currentTripId) {
      const match = userTrips.find((t) => t.id === currentTripId);
      if (match) return match;
    }
    // Nếu có tour đang chạy, mặc định hiển thị
    if (userActiveTrip) return userActiveTrip;
    return null;
  }, [userTrips, userActiveTrip, currentTripId]);

  // Sync trips to local storage
  useEffect(() => {
    try {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (e) {
      console.error(e);
    }
  }, [trips]);

  // Sync user profile to local storage & Firestore
  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      if (currentUser.isLoggedIn) {
        saveUserProfileToFirestore(currentUser);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Subscribe to real Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = subscribeToAuthState((profile) => {
      if (profile) {
        setCurrentUser(profile);
      }
    });
    return () => unsubAuth();
  }, []);

  // Realtime Firestore trips listener (chỉ lắng nghe tour của user)
  useEffect(() => {
    if (!currentUser.id) return;
    testFirestoreConnection();

    const unsubscribe = subscribeToUserTrips(currentUser.id, (firestoreTrips) => {
      if (firestoreTrips) {
        setTrips((prevTrips) => {
          const map = new Map<string, Trip>();
          // Bỏ toàn bộ mock trips
          prevTrips.forEach((t) => {
            if (t.id !== 'trip-ha-giang-2026' && t.id !== 'trip-ta-xua-2026') {
              map.set(t.id, t);
            }
          });
          firestoreTrips.forEach((t) => {
            if (t.id !== 'trip-ha-giang-2026' && t.id !== 'trip-ta-xua-2026') {
              map.set(t.id, t);
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Helper to update current trip both in state and Firestore
  const updateCurrentTrip = (updater: (prev: Trip) => Trip) => {
    if (!currentTrip) return;
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id === currentTrip.id) {
          const updated = updater(t);
          saveTripToFirestore(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  };

  // Google Login (Real Firebase Auth Popup)
  const handleLoginWithRealFirebaseGoogle = async () => {
    try {
      const userProfile = await signInWithGoogleReal();
      setCurrentUser(userProfile);
      setActiveTab('home');
    } catch (err) {
      console.warn('Real Firebase Google login popup exception:', err);
      throw err;
    }
  };

  // Fast Login with Google Account
  const handleLoginWithGoogle = async (email?: string, name?: string) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return;
    const userId = `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const existing = await getUserProfileFromFirestore(userId);

    const userProfile: UserProfile = {
      id: userId,
      name: name || existing?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar: existing?.avatar || '',
      phone: existing?.phone || '',
      vehicle: existing?.vehicle || '',
      bankName: existing?.bankName || '',
      bankCode: existing?.bankCode || '',
      accountNumber: existing?.accountNumber || '',
      accountName: existing?.accountName || '',
      isLoggedIn: true,
      authProvider: 'google',
    };

    setCurrentUser(userProfile);
    saveUserProfileToFirestore(userProfile);
    setActiveTab('home');
    setIsAuthModalOpen(false);
  };

  // Profile update handler that also updates trip membership
  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    saveUserProfileToFirestore(updated).catch(() => {});

    if (currentTrip) {
      updateCurrentTrip((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === updated.id
            ? {
                ...m,
                name: updated.name,
                avatar: updated.avatar,
                phone: updated.phone,
                vehicle: updated.vehicle,
                bankName: updated.bankName,
                bankCode: updated.bankCode,
                accountNumber: updated.accountNumber,
                accountName: updated.accountName,
              }
            : m
        ),
      }));
    }
  };

  // Re-sync from active Google account
  const handleResyncGoogle = async () => {
    try {
      const refreshed = await resyncGoogleProfile(currentUser);
      setCurrentUser(refreshed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutReal();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
    setCurrentTripId('');
    setIsAuthModalOpen(false);
  };

  const handleResetAllData = () => {
    localStorage.removeItem(TRIPS_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setTrips([]);
    setCurrentUser(DEFAULT_CURRENT_USER);
    setCurrentTripId('');
    setActiveTab('home');
    setIsAuthModalOpen(false);
  };

  // Tự động tham gia tour nếu người dùng truy cập từ link invite và đã đăng nhập
  useEffect(() => {
    if (!currentUser.isLoggedIn || !currentUser.id) return;
    const pendingCode = sessionStorage.getItem('phuotmate_pending_invite');
    if (pendingCode) {
      sessionStorage.removeItem('phuotmate_pending_invite');
      handleJoinTripByCode(pendingCode);
    }
  }, [currentUser.isLoggedIn, currentUser.id]);

  // 1. Join trip by 6-char code (Đồng bộ trực tiếp Cloud Firestore)
  const handleJoinTripByCode = async (code: string): Promise<{ success: boolean; message?: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Vui lòng nhập mã mời!' };

    if (!currentUser.isLoggedIn || !currentUser.id) {
      sessionStorage.setItem('phuotmate_pending_invite', cleanCode);
      return { success: false, message: 'Vui lòng đăng nhập để tham gia tour!' };
    }

    if (userActiveTrip) {
      if (userActiveTrip.inviteCode.toUpperCase() === cleanCode) {
        setCurrentTripId(userActiveTrip.id);
        setActiveTab('overview');
        return { success: true };
      }
      return { 
        success: false, 
        message: `Bạn đang tham gia chuyến đi "${userActiveTrip.title}". Vui lòng thoát tour hiện tại trước khi tham gia tour mới!` 
      };
    }

    try {
      // 1. Tham gia trực tiếp trên Cloud Firestore
      const joined = await joinTripInFirestore(cleanCode, currentUser);
      if (joined) {
        setTrips((prev) => {
          const map = new Map<string, Trip>();
          prev.forEach((t) => map.set(t.id, t));
          map.set(joined.id, joined);
          return Array.from(map.values());
        });
        setCurrentTripId(joined.id);
        setActiveTab('overview');
        return { success: true };
      }

      // 2. Fallback kiểm tra danh sách tour hiện tại
      const target = trips.find((t) => t.inviteCode.toUpperCase() === cleanCode);
      if (target) {
        const now = new Date().toISOString();
        const existingIdx = target.members.findIndex((m) => m.id === currentUser.id);
        let updatedMembers: Member[];

        if (existingIdx >= 0) {
          updatedMembers = target.members.map((m, idx) =>
            idx === existingIdx
              ? {
                  ...m,
                  status: 'active' as const,
                  joinedAt: now,
                  leftAt: undefined,
                }
              : m
          );
        } else {
          const newMember: Member = {
            id: currentUser.id,
            name: currentUser.name || 'Biker',
            avatar: currentUser.avatar || '',
            phone: currentUser.phone || '',
            role: 'Thành viên (Rider)',
            vehicle: currentUser.vehicle || '',
            bankName: currentUser.bankName || '',
            bankCode: currentUser.bankCode || '',
            accountNumber: currentUser.accountNumber || '',
            accountName: currentUser.accountName || '',
            status: 'active',
            joinedAt: now,
          };
          updatedMembers = [...target.members, newMember];
        }

        const updatedTarget: Trip = {
          ...target,
          members: updatedMembers,
        };

        setTrips((prev) => prev.map((t) => (t.id === target.id ? updatedTarget : t)));
        saveTripToFirestore(updatedTarget).catch(() => {});
        setCurrentTripId(target.id);
        setActiveTab('overview');
        return { success: true };
      }

      return { success: false, message: 'Không tìm thấy tour với mã mời này hoặc mã không hợp lệ.' };
    } catch (e: any) {
      console.error('Lỗi khi tham gia tour:', e);
      return { success: false, message: 'Lỗi kết nối khi tham gia tour. Vui lòng thử lại!' };
    }
  };

  // 2. Create new trip (Creator is currentUser)
  const handleCreateTrip = (newTripData: Partial<Trip>) => {
    if (userActiveTrip) {
      alert(`Bạn đang tham gia chuyến đi "${userActiveTrip.title}". Vui lòng hoàn thành hoặc Thoát tour hiện tại trước khi tạo tour mới!`);
      return;
    }

    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    const now = new Date().toISOString();
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      title: newTripData.title || 'Chuyến Đi Phượt Mới',
      inviteCode: code,
      departure: newTripData.departure || 'Hà Nội',
      destination: newTripData.destination || 'Điểm Đến',
      startDate: newTripData.startDate || now.split('T')[0],
      endDate: newTripData.endDate || now.split('T')[0],
      coverImage: newTripData.coverImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      defaultVehicle: newTripData.defaultVehicle || 'Côn tay (Winner X, Exciter, Raider)',
      vibe: newTripData.vibe || 'Phượt khám phá',
      status: 'active',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      members: [
        {
          id: currentUser.id,
          name: `${currentUser.name} (Bạn)`,
          avatar: currentUser.avatar,
          phone: currentUser.phone,
          role: 'Trưởng đoàn (Lead)',
          vehicle: currentUser.vehicle,
          bankName: currentUser.bankName,
          bankCode: currentUser.bankCode,
          accountNumber: currentUser.accountNumber,
          accountName: currentUser.accountName,
          status: 'active',
          joinedAt: now,
        },
      ],
      days: [
        {
          dayNumber: 1,
          dateLabel: 'Ngày 1',
          routeTitle: `${newTripData.departure} ➔ ${newTripData.destination}`,
          totalKm: 180,
          cards: [],
        },
      ],
      expenses: [],
      photos: [],
      gearChecklist: [
        'Bộ giáp bảo hộ tay chân 4 món',
        'Mũ bảo hiểm đạt chuẩn 3/4 hoặc Fullface',
        'Bộ đồ nghề vá lốp xe máy mini',
        'Áo mưa bộ cản gió lạnh đèo',
        'Túi sơ cứu y tế',
      ],
      vehicleAdvice: 'Kiểm tra kỹ áp suất lốp xe và độ căng xích. Đổ đèo dốc gắt giữ số 2 hoặc 3 để hãm động cơ.',
    };

    setTrips((prev) => [newTrip, ...prev]);
    saveTripToFirestore(newTrip).catch(() => {});
    setCurrentTripId(newTrip.id);
    setActiveTab('overview');
  };

  // 3. Leave trip (Thoát tour)
  const handleLeaveTrip = (tripId: string) => {
    const now = new Date().toISOString();
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id === tripId) {
          const updatedMembers = t.members.map((m) =>
            m.id === currentUser.id
              ? {
                  ...m,
                  status: 'left' as const,
                  leftAt: now,
                }
              : m
          );
          const updatedTrip = { ...t, members: updatedMembers };
          saveTripToFirestore(updatedTrip).catch(() => {});
          return updatedTrip;
        }
        return t;
      })
    );
    leaveTripInFirestore(tripId, currentUser.id).catch(() => {});
    setCurrentTripId('');
    setActiveTab('home');
  };

  // 4. Toggle Trip Status (Chỉ người tạo mới có quyền xác nhận hoàn thành)
  const handleToggleTripStatus = async (tripId: string) => {
    const targetTrip = trips.find((t) => t.id === tripId);
    if (!targetTrip) return;

    if (targetTrip.createdBy !== currentUser.id) {
      return;
    }

    if (targetTrip.status === 'active') {
      // Mở modal xác nhận hoàn thành tour có popup nhắc nhở chi phí & thanh toán
      setTripToConfirmComplete(targetTrip);
    } else {
      // Đang hoàn thành -> Kích hoạt lại
      performToggleTripStatus(tripId, 'active');
    }
  };

  const performToggleTripStatus = async (tripId: string, nextStatus: 'active' | 'completed') => {
    const now = new Date().toISOString();
    setTrips((prevTrips) =>
      prevTrips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? now : undefined,
            }
          : t
      )
    );
    await updateTripStatusInFirestore(tripId, nextStatus, currentUser.id).catch(() => {});
  };

  // Select trip from Home or Switcher
  const handleSelectTrip = (tripId: string) => {
    setCurrentTripId(tripId);
    setActiveTab('overview');
  };

  // Add member by Lead/sweep
  const handleAddMember = (newMember: Member) => {
    updateCurrentTrip((prev) => ({
      ...prev,
      members: [...prev.members, { ...newMember, status: 'active', joinedAt: new Date().toISOString() }],
    }));
  };

  // Update Itinerary
  const handleUpdateDays = (updatedDays: ItineraryDay[]) => {
    updateCurrentTrip((prev) => ({
      ...prev,
      days: updatedDays,
    }));
  };

  // Apply AI Plan
  const handleApplyAiPlan = (plan: any) => {
    updateCurrentTrip((prev) => ({
      ...prev,
      title: plan.title || prev.title,
      vibe: plan.vibe || prev.vibe,
      days: plan.days || prev.days,
      gearChecklist: plan.gearChecklist || prev.gearChecklist,
      vehicleAdvice: plan.vehicleAdvice || prev.vehicleAdvice,
    }));
    setActiveTab('itinerary');
  };

  // Update AI Story results
  const handleUpdateStoryResult = (aiResult: any) => {
    updateCurrentTrip((prev) => ({
      ...prev,
      aiStory: aiResult,
    }));
  };

  // Add expense (Đồng bộ tức thì lên Cloud Firestore)
  const handleAddExpense = async (expense: Expense) => {
    if (!currentTrip) return;
    const updatedExpenses = [expense, ...(currentTrip.expenses || [])];
    const updatedTrip: Trip = {
      ...currentTrip,
      expenses: updatedExpenses,
    };

    setTrips((prevTrips) =>
      prevTrips.map((t) => (t.id === currentTrip.id ? updatedTrip : t))
    );

    try {
      await saveTripToFirestore(updatedTrip);
    } catch (e) {
      console.error('Lỗi khi đồng bộ chi phí lên Firestore:', e);
    }
  };

  // Delete expense (Đồng bộ tức thì lên Cloud Firestore)
  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentTrip) return;
    const updatedExpenses = (currentTrip.expenses || []).filter((e) => e.id !== expenseId);
    const updatedTrip: Trip = {
      ...currentTrip,
      expenses: updatedExpenses,
    };

    setTrips((prevTrips) =>
      prevTrips.map((t) => (t.id === currentTrip.id ? updatedTrip : t))
    );

    try {
      await saveTripToFirestore(updatedTrip);
    } catch (e) {
      console.error('Lỗi khi xóa chi phí trên Firestore:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:py-6 selection:bg-orange-500 selection:text-white">
      {/* Outer Shell Device Simulator */}
      <div
        className={`w-full transition-all duration-300 ${
          deviceMode === 'iphone'
            ? 'max-w-[420px] sm:my-3 sm:rounded-[50px] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden bg-slate-950 ring-1 ring-slate-700/50'
            : deviceMode === 'android'
            ? 'max-w-[430px] sm:my-3 sm:rounded-[40px] sm:border-[6px] sm:border-slate-800 sm:shadow-2xl overflow-hidden bg-slate-950'
            : 'max-w-lg min-h-screen'
        }`}
      >
        {/* Native Mobile Status Bar */}
        <div className="bg-slate-950 px-6 pt-2 pb-1 flex items-center justify-between text-xs text-slate-300 select-none z-40">
          <div className="font-semibold tracking-tight text-[11px] font-mono">
            09:41
          </div>

          {/* Dynamic Island / Punch Hole */}
          {deviceMode === 'iphone' && (
            <div className="h-5 w-24 bg-black rounded-full mx-auto flex items-center justify-center space-x-1.5 px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse"></span>
            </div>
          )}
          {deviceMode === 'android' && (
            <div className="h-3 w-3 bg-black rounded-full mx-auto"></div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Authentication Gate: When logged out, render LoginScreen only */}
        {!currentUser.isLoggedIn ? (
          <LoginScreen 
            onLoginWithGoogle={handleLoginWithGoogle}
            onLoginWithRealFirebaseGoogle={handleLoginWithRealFirebaseGoogle}
          />
        ) : (
          <>
            {/* Mobile Header with User info, Trip Switcher & Home Action */}
            <MobileHeader
              currentTrip={currentTrip}
              currentUser={currentUser}
              isAtHome={activeTab === 'home'}
              onGoHome={() => setActiveTab('home')}
              onOpenProfile={() => setIsAuthModalOpen(true)}
              onOpenTripSelector={() => setIsTripSelectorOpen(true)}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenArchitecture={() => setActiveTab('architecture')}
              deviceMode={deviceMode}
              setDeviceMode={setDeviceMode}
            />

            {/* Main Content Area */}
            <main className="px-3 pt-3 min-h-[calc(100vh-140px)]">
              {activeTab === 'home' && (
                <HomeView
                  trips={trips}
                  currentUser={currentUser}
                  onSelectTrip={handleSelectTrip}
                  onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
                  onJoinTripByCode={handleJoinTripByCode}
                  onToggleTripStatus={handleToggleTripStatus}
                  onOpenProfile={() => setIsAuthModalOpen(true)}
                />
              )}

              {activeTab === 'overview' && (
                currentTrip ? (
                  <TripOverviewTab
                    trip={currentTrip}
                    currentUser={currentUser}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenInvite={() => setIsInviteModalOpen(true)}
                    onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
                    onToggleTripStatus={handleToggleTripStatus}
                    onLeaveTrip={handleLeaveTrip}
                  />
                ) : (
                  <EmptyTourView
                    type="overview"
                    pastTrips={userTrips}
                    onSelectPastTrip={handleSelectTrip}
                    onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
                    onGoHome={() => setActiveTab('home')}
                  />
                )
              )}

              {activeTab === 'itinerary' && (
                currentTrip ? (
                  <ItineraryView
                    trip={currentTrip}
                    onUpdateDays={handleUpdateDays}
                    onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
                  />
                ) : (
                  <EmptyTourView
                    type="itinerary"
                    pastTrips={userTrips}
                    onSelectPastTrip={handleSelectTrip}
                    onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
                    onGoHome={() => setActiveTab('home')}
                  />
                )
              )}

              {activeTab === 'story' && (
                currentTrip ? (
                  <StorytellerView
                    trip={currentTrip}
                    onUpdateStoryResult={handleUpdateStoryResult}
                  />
                ) : (
                  <EmptyTourView
                    type="ai"
                    pastTrips={userTrips}
                    onSelectPastTrip={handleSelectTrip}
                    onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
                    onGoHome={() => setActiveTab('home')}
                  />
                )
              )}

              {activeTab === 'expenses' && (
                currentTrip ? (
                  <ExpenseView
                    trip={currentTrip}
                    currentUser={currentUser}
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                ) : (
                  <EmptyTourView
                    type="expenses"
                    pastTrips={userTrips}
                    onSelectPastTrip={handleSelectTrip}
                    onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
                    onGoHome={() => setActiveTab('home')}
                  />
                )
              )}

              {activeTab === 'architecture' && <StoreArchitectureView />}
            </main>

            {/* Bottom Navigation */}
            <BottomNav
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              unreadExpenseCount={currentTrip ? currentTrip.expenses.length : 0}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onCreateTrip={handleCreateTrip}
      />

      <TripSelectorModal
        trips={userTrips}
        currentTripId={currentTrip ? currentTrip.id : ''}
        isOpen={isTripSelectorOpen}
        onClose={() => setIsTripSelectorOpen(false)}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTrip}
        onJoinTripByCode={handleJoinTripByCode}
      />

      {currentTrip && (
        <InviteModal
          trip={currentTrip}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onAddMember={handleAddMember}
        />
      )}

      {currentTrip && (
        <AiPlannerModal
          isOpen={isAiPlannerOpen}
          onClose={() => setIsAiPlannerOpen(false)}
          currentDeparture={currentTrip.departure}
          currentDestination={currentTrip.destination}
          currentVehicle={currentTrip.defaultVehicle}
          onApplyPlan={handleApplyAiPlan}
        />
      )}

      <AuthModal
        currentUser={currentUser}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onResyncGoogle={handleResyncGoogle}
        onLogout={handleLogout}
        onResetAllData={handleResetAllData}
      />

      <CompleteTripModal
        isOpen={!!tripToConfirmComplete}
        trip={tripToConfirmComplete}
        onClose={() => setTripToConfirmComplete(null)}
        onConfirmComplete={(tripId) => {
          performToggleTripStatus(tripId, 'completed');
          setTripToConfirmComplete(null);
        }}
        onNavigateToExpenses={() => {
          if (tripToConfirmComplete) {
            setCurrentTripId(tripToConfirmComplete.id);
            setActiveTab('expenses');
          }
          setTripToConfirmComplete(null);
        }}
      />
    </div>
  );
}
