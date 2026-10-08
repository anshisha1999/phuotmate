import React, { useState, useEffect } from 'react';
import { Trip, UserProfile } from './types/trip';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { TripOverviewTab } from './components/trip/TripOverviewTab';
import { ItineraryView } from './components/itinerary/ItineraryView';
import { ExpenseView } from './components/expense/ExpenseView';
import { HomeView } from './components/home/HomeView';
import { EmptyTourView } from './components/common/EmptyTourView';
import { CreateTripModal } from './components/trip/CreateTripModal';
import { InviteModal } from './components/trip/InviteModal';
import { AiPlannerModal } from './components/itinerary/AiPlannerModal';
import { AuthModal } from './components/auth/AuthModal';
import { CompleteTripModal } from './components/trip/CompleteTripModal';
import { LoginScreen } from './components/auth/LoginScreen';
import {
  subscribeToAuthState, loadUserProfile, signInWithGoogle, signOutUser, saveUserProfile,
  applyGoogleAccountInfo, subscribeToUserTrips, createTrip, joinTripByCode, leaveTrip,
  completeTrip, updateTripInfo, countCardsOutsideDates, updateMemberProfile, describeFirebaseError, TripInfoInput
} from './services/firebase';
import { getTripDates, getTripPermissions, isUserInActiveTrip } from './services/tripRules';
import { calculateBalancesAndDebts } from './services/debtSimplifier';
import { useTripDetails } from './hooks/useTripDetails';
import { Loader2, BookOpen, X } from 'lucide-react';

const PENDING_INVITE_KEY = 'phuotmate_pending_invite';

export type ActionResult = { success: boolean; message?: string };

function showError(error: unknown, fallback: string) {
  console.error(error);
  alert(describeFirebaseError(error, fallback));
}

export default function App() {
  // 1. Người dùng đăng nhập (Firebase Auth là nguồn sự thật duy nhất)
  const [authStatus, setAuthStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // 2. Danh sách tour realtime từ Firestore (tour đang/đã tham gia)
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoaded, setTripsLoaded] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<string>('');

  // Default landing tab is 'home' (Trang chủ)
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals state
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAiPlannerOpen, setIsAiPlannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Lắng nghe param ?invite= hoặc ?code= từ link chia sẻ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite') || params.get('code');
    if (inviteParam) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteParam.trim().toUpperCase());
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Subscribe to real Firebase Auth state changes
  useEffect(() => {
    return subscribeToAuthState(async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setTrips([]);
        setTripsLoaded(false);
        setCurrentTripId('');
        setAuthStatus('signedOut');
        return;
      }
      try {
        setCurrentUser(await loadUserProfile(fbUser));
        setAuthStatus('signedIn');
      } catch (e) {
        showError(e, 'Không tải được hồ sơ người dùng. Vui lòng thử lại!');
        await signOutUser();
      }
    });
  }, []);

  // Realtime Firestore trips listener (chỉ lắng nghe tour của user)
  const userId = currentUser?.id || '';
  useEffect(() => {
    if (!userId) return;
    return subscribeToUserTrips(userId, (loaded) => {
      setTrips(loaded);
      setTripsLoaded(true);
    }, (err) => console.warn('Realtime trips listener:', err.message));
  }, [userId]);

  // Tour đang diễn ra mà người dùng chưa thoát (mỗi người chỉ ở 1 tour đang chạy)
  const userActiveTrip = trips.find((t) => isUserInActiveTrip(t, userId)) || null;

  // Tour đang xem: tour người dùng chọn, mặc định là tour đang chạy
  const currentTrip = trips.find((t) => t.id === currentTripId) || userActiveTrip;
  // Đang xem lại 1 tour trong lịch sử (không phải tour đang tham gia) - chế độ chỉ xem tạm thời
  const isViewingHistory = !!currentTrip && currentTrip.id !== userActiveTrip?.id;
  const details = useTripDetails(currentTrip?.id || null);
  const permissions = currentTrip ? getTripPermissions(currentTrip, userId) : null;

  // Tự động tham gia tour nếu người dùng truy cập từ link invite (sau khi đã tải xong danh sách tour)
  useEffect(() => {
    if (authStatus !== 'signedIn' || !tripsLoaded) return;
    const pendingCode = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (pendingCode) {
      sessionStorage.removeItem(PENDING_INVITE_KEY);
      handleJoinTripByCode(pendingCode).then((res) => {
        if (!res.success && res.message) alert(res.message);
      });
    }
  }, [authStatus, tripsLoaded]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
        <span>Đang kết nối tài khoản...</span>
      </div>
    );
  }

  if (authStatus === 'signedOut' || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center">
        <div className="w-full max-w-lg">
          <LoginScreen onLogin={signInWithGoogle} />
        </div>
      </div>
    );
  }

  // Chỉ ghi nhớ tour trong lịch sử; tour đang tham gia luôn là mặc định nên không cần lưu
  const openTrip = (tripId: string) => {
    setCurrentTripId(tripId === userActiveTrip?.id ? '' : tripId);
    setActiveTab('overview');
  };

  // Mở tour vừa tạo / vừa tham gia (tour này trở thành tour đang tham gia)
  const openActiveTrip = () => {
    setCurrentTripId('');
    setActiveTab('overview');
  };

  // 1. Join trip by 6-char code
  async function handleJoinTripByCode(code: string): Promise<ActionResult> {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) return { success: false, message: 'Mã mời gồm 6 ký tự.' };
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập để tham gia tour!' };

    if (userActiveTrip) {
      if (userActiveTrip.inviteCode === cleanCode) {
        openActiveTrip();
        return { success: true };
      }
      return {
        success: false,
        message: `Bạn đang tham gia chuyến đi "${userActiveTrip.title}". Vui lòng thoát tour hiện tại trước khi tham gia tour mới!`,
      };
    }

    try {
      await joinTripByCode(cleanCode, currentUser);
      openActiveTrip();
      return { success: true };
    } catch (e) {
      console.error('Lỗi khi tham gia tour:', e);
      return { success: false, message: describeFirebaseError(e, 'Lỗi kết nối khi tham gia tour. Vui lòng thử lại!') };
    }
  }

  // 2. Create new trip (Creator is Lead)
  const handleCreateTrip = async (input: TripInfoInput): Promise<ActionResult> => {
    if (userActiveTrip) {
      return {
        success: false,
        message: `Bạn đang tham gia chuyến đi "${userActiveTrip.title}". Vui lòng hoàn thành hoặc thoát tour hiện tại trước khi tạo tour mới!`,
      };
    }
    try {
      await createTrip(input, currentUser);
      openActiveTrip();
      return { success: true };
    } catch (e) {
      console.error('Lỗi tạo tour:', e);
      return { success: false, message: describeFirebaseError(e, 'Không tạo được tour. Vui lòng thử lại!') };
    }
  };

  // 3. Lead sửa thông tin tour; cảnh báo nếu rút ngắn ngày làm mất lịch trình
  const handleUpdateTripInfo = async (input: TripInfoInput): Promise<ActionResult> => {
    if (!currentTrip) return { success: false };
    const newDates = new Set(getTripDates(input.startDate, input.endDate));
    const removedDates = getTripDates(currentTrip.startDate, currentTrip.endDate).filter((d) => !newDates.has(d));

    try {
      const removedCardCount = await countCardsOutsideDates(currentTrip.id, input.startDate, input.endDate);
      const hasRemovedDayInfo = Object.keys(currentTrip.dayInfo).some((d) => !newDates.has(d));
      if (removedCardCount > 0 || hasRemovedDayInfo) {
        const ok = confirm(
          `⚠️ Ngày đi/về mới làm mất ${removedDates.length} ngày trong lịch trình` +
            (removedCardCount > 0 ? ` (${removedCardCount} thẻ chặng)` : '') +
            '. Lịch trình của các ngày này sẽ bị xóa. Tiếp tục?'
        );
        if (!ok) return { success: false };
      }

      await updateTripInfo(currentTrip, input);
      return { success: true };
    } catch (e) {
      console.error('Lỗi cập nhật tour:', e);
      return { success: false, message: describeFirebaseError(e, 'Không lưu được thông tin tour. Vui lòng thử lại!') };
    }
  };

  // 4. Leave trip (chỉ thành viên, Lead không được thoát khi tour đang chạy)
  const handleLeaveTrip = async (tripId: string) => {
    try {
      await leaveTrip(tripId, currentUser.id);
      setCurrentTripId('');
      setActiveTab('home');
    } catch (e) {
      showError(e, 'Không thoát được tour. Vui lòng thử lại!');
    }
  };

  // 5. Lead xác nhận hoàn thành tour (không thể mở lại)
  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    try {
      await completeTrip(currentTrip);
      // Tour vừa hoàn thành chuyển sang lịch sử: Lead tiếp tục xem lại tour này
      setCurrentTripId(currentTrip.id);
    } catch (e) {
      showError(e, 'Không xác nhận hoàn thành được. Vui lòng thử lại!');
    }
  };

  // Profile update: lưu hồ sơ và cập nhật hồ sơ trong tour đang tham gia
  const handleUpdateProfile = async (updated: UserProfile) => {
    try {
      await saveUserProfile(updated);
      if (userActiveTrip) {
        await updateMemberProfile(userActiveTrip.id, updated);
      }
      setCurrentUser(updated);
    } catch (e) {
      showError(e, 'Không lưu được hồ sơ. Vui lòng thử lại!');
      throw e;
    }
  };

  // Re-sync from active Google account
  const handleResyncGoogle = () => handleUpdateProfile(applyGoogleAccountInfo(currentUser));

  const handleLogout = async () => {
    setIsAuthModalOpen(false);
    try {
      await signOutUser();
    } catch (e) {
      showError(e, 'Không đăng xuất được. Vui lòng thử lại!');
    }
  };

  // Về Trang chủ = thoát chế độ xem lại; các tab quay về tour đang tham gia
  const changeTab = (tab: TabType) => {
    if (tab === 'home') setCurrentTripId('');
    setActiveTab(tab);
  };

  const unsettledDebtCount = calculateBalancesAndDebts(details.members, details.expenses, details.payments).settlements.length;

  const renderTripTab = (tab: 'overview' | 'itinerary' | 'expenses') => {
    if (!currentTrip || !permissions) {
      return (
        <EmptyTourView
          type={tab}
          pastTrips={trips}
          currentUserId={currentUser.id}
          onSelectPastTrip={openTrip}
          onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
          onGoHome={() => changeTab('home')}
        />
      );
    }
    if (tab === 'overview') {
      return (
        <TripOverviewTab
          trip={currentTrip}
          members={details.members}
          expenses={details.expenses}
          currentUser={currentUser}
          permissions={permissions}
          onNavigateTab={changeTab}
          onOpenInvite={() => setIsInviteModalOpen(true)}
          onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
          onOpenEditTrip={() => setIsEditTripModalOpen(true)}
          onRequestComplete={() => setIsCompleteModalOpen(true)}
          onLeaveTrip={handleLeaveTrip}
        />
      );
    }
    if (tab === 'itinerary') {
      return (
        <ItineraryView
          key={currentTrip.id}
          trip={currentTrip}
          cards={details.cards}
          currentUser={currentUser}
          permissions={permissions}
          onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
        />
      );
    }
    return (
      <ExpenseView
        key={currentTrip.id}
        trip={currentTrip}
        members={details.members}
        expenses={details.expenses}
        payments={details.payments}
        currentUser={currentUser}
        permissions={permissions}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-lg min-h-screen">
        {/* Mobile Header with logo & user profile */}
        <MobileHeader
          currentUser={currentUser}
          onOpenProfile={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="px-3 pt-3 min-h-[calc(100vh-140px)]">
          {activeTab === 'home' ? (
            <HomeView
              trips={trips}
              currentUser={currentUser}
              onSelectTrip={openTrip}
              onOpenCreateTrip={() => setIsCreateTripModalOpen(true)}
              onJoinTripByCode={handleJoinTripByCode}
              onOpenProfile={() => setIsAuthModalOpen(true)}
            />
          ) : (
            <>
              {isViewingHistory && currentTrip && (
                <div className="mb-3 p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">
                      Đang xem lại: <strong className="text-white">{currentTrip.title}</strong> (chỉ xem)
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentTripId('')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Đóng</span>
                  </button>
                </div>
              )}
              {renderTripTab(activeTab)}
            </>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={changeTab}
          expenseCount={currentTrip ? details.expenses.length : 0}
        />
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onSubmit={handleCreateTrip}
      />

      {currentTrip && permissions?.isLead && (
        <CreateTripModal
          key={`edit-${currentTrip.id}`}
          isOpen={isEditTripModalOpen}
          editTrip={currentTrip}
          onClose={() => setIsEditTripModalOpen(false)}
          onSubmit={handleUpdateTripInfo}
        />
      )}

      {currentTrip && permissions && (
        <InviteModal
          trip={currentTrip}
          members={details.members}
          canInvite={permissions.canEdit}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {currentTrip && permissions?.canUseAi && (
        <AiPlannerModal
          key={`ai-${currentTrip.id}`}
          isOpen={isAiPlannerOpen}
          onClose={() => setIsAiPlannerOpen(false)}
          trip={currentTrip}
          existingCards={details.cards}
          currentUserId={currentUser.id}
          onApplied={() => setActiveTab('itinerary')}
        />
      )}

      <AuthModal
        currentUser={currentUser}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onResyncGoogle={handleResyncGoogle}
        onLogout={handleLogout}
      />

      {currentTrip && permissions?.canComplete && (
        <CompleteTripModal
          isOpen={isCompleteModalOpen}
          trip={currentTrip}
          activeMemberCount={currentTrip.activeMemberIds.length}
          totalExpense={details.expenses.reduce((sum, e) => sum + e.amount, 0)}
          unsettledDebtCount={unsettledDebtCount}
          onClose={() => setIsCompleteModalOpen(false)}
          onConfirmComplete={handleCompleteTrip}
          onNavigateToExpenses={() => setActiveTab('expenses')}
        />
      )}
    </div>
  );
}
