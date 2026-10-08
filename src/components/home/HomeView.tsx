import React, { useState } from 'react';
import { Trip, UserProfile } from '../../types/trip';
import { getTripDates, getTripTotalKm, isUserInActiveTrip, formatDate } from '../../services/tripRules';
import type { ActionResult } from '../../App';
import {
  Compass, Plus, LogIn, MapPin, Calendar, Users,
  CheckCircle2, Check, AlertCircle, Sparkles,
  Bike, ChevronRight, ShieldCheck, QrCode
} from 'lucide-react';

interface HomeViewProps {
  trips: Trip[];
  currentUser: UserProfile;
  onSelectTrip: (tripId: string) => void;
  onOpenCreateTrip: () => void;
  onJoinTripByCode: (code: string) => Promise<ActionResult>;
  onOpenProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  trips,
  currentUser,
  onSelectTrip,
  onOpenCreateTrip,
  onJoinTripByCode,
  onOpenProfile,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeTourWarning, setActiveTourWarning] = useState<string | null>(null);

  // Danh sách tour đã được lọc sẵn theo tài khoản (đang hoặc đã từng tham gia)
  const userTrips = trips;

  // Tour is active for the current user ONLY IF the tour status is 'active' AND this user has NOT left!
  const isUserActiveInTrip = (t: Trip) => isUserInActiveTrip(t, currentUser.id);

  // Active tour that user is CURRENTLY participating in (has NOT left)
  const currentActiveTrip = userTrips.find(isUserActiveInTrip);

  const activeTripsCount = userTrips.filter(isUserActiveInTrip).length;
  const completedTripsCount = userTrips.filter((t) => t.status === 'completed').length;
  const totalKm = userTrips.reduce((sum, t) => sum + getTripTotalKm(t), 0);

  const displayedTrips = userTrips.filter((t) => {
    if (filterStatus === 'active') return isUserActiveInTrip(t);
    if (filterStatus === 'completed') return t.status === 'completed';
    return true;
  });

  const handleCreateTripClick = () => {
    if (currentActiveTrip) {
      setActiveTourWarning(
        `Bạn đang tham gia chuyến đi "${currentActiveTrip.title}". Vui lòng hoàn thành hoặc Thoát tour hiện tại trước khi tạo chuyến đi mới!`
      );
      return;
    }
    setActiveTourWarning(null);
    onOpenCreateTrip();
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    setActiveTourWarning(null);

    const clean = inviteCodeInput.trim().toUpperCase();
    if (!clean) return;

    if (currentActiveTrip) {
      setJoinError(
        `Bạn đang tham gia tour "${currentActiveTrip.title}". Vui lòng thoát tour hiện tại trước khi tham gia tour mới!`
      );
      return;
    }

    setIsJoining(true);
    try {
      const res = await onJoinTripByCode(clean);
      if (res.success) {
        setJoinSuccess(`Đã tham gia tour #${clean} thành công!`);
        setInviteCodeInput('');
        setTimeout(() => setJoinSuccess(''), 3000);
      } else {
        setJoinError(res.message || 'Không tìm thấy tour với mã mời này hoặc mã không hợp lệ.');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Lỗi khi tham gia tour. Vui lòng thử lại!');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* User Greeting & Stats Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenProfile}
              className="relative group focus:outline-none"
              title="Xem & Chỉnh sửa hồ sơ Biker"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-500 shadow-md group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-base border-2 border-orange-400 shadow group-hover:scale-105 transition">
                  {(currentUser.name || currentUser.email || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  Sổ Phượt Cá Nhân
                </span>
                <span className="px-1.5 py-0.2 text-[9px] bg-slate-800 text-slate-300 rounded-full font-mono border border-slate-700">
                  Google ID
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>{currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Biker')}</span>
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>🏍️ {currentUser.vehicle ? currentUser.vehicle : <span className="text-slate-500 italic">Chưa cập nhật xe máy</span>}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Hồ sơ
          </button>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-center">
          <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-400 font-medium">Tổng Tour</div>
            <div className="text-sm font-black text-white mt-0.5">{userTrips.length}</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-emerald-400 font-medium">Đang chạy</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">{activeTripsCount}</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-400 font-medium">Đã xong</div>
            <div className="text-sm font-black text-slate-300 mt-0.5">{completedTripsCount}</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-amber-400 font-medium">Tổng KM</div>
            <div className="text-sm font-black text-amber-400 mt-0.5">{totalKm}</div>
          </div>
        </div>
      </div>

      {/* Action Bar: Create Trip & Join by ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Create Trip Big Button */}
        <button
          onClick={handleCreateTripClick}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">Tạo Chuyến Đi Mới</div>
              <div className="text-[10px] text-orange-100 font-normal">
                {currentActiveTrip ? 'Đang trong tour • Phải thoát trước' : 'Bạn sẽ là Trưởng đoàn (Lead)'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition" />
        </button>

        {/* Join Trip by ID form */}
        <form
          onSubmit={handleJoinSubmit}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={6}
              placeholder="Nhập mã tour (vd: HG8824)"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-amber-400 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 uppercase font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={isJoining}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition active:scale-95 shrink-0 flex items-center gap-1 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5 text-orange-400" />
            <span>Vào đoàn</span>
          </button>
        </form>
      </div>

      {/* Active tour warning */}
      {activeTourWarning && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold text-amber-300">Không thể tạo hoặc tham gia tour mới</div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">{activeTourWarning}</p>
            {currentActiveTrip && (
              <button
                onClick={() => onSelectTrip(currentActiveTrip.id)}
                className="mt-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition"
              >
                Vào xem chuyến đi đang chạy ({currentActiveTrip.title})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Join feedback toasts */}
      {joinError && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{joinError}</span>
        </div>
      )}
      {joinSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{joinSuccess}</span>
        </div>
      )}

      {/* Trips Section & Status Filter Tabs */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-400" />
            <span>Danh Sách Tour Đã Tham Gia ({userTrips.length})</span>
          </h3>

          {/* Status filter tabs */}
          <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({userTrips.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang chạy ({activeTripsCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'completed'
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đã xong ({completedTripsCount})
            </button>
          </div>
        </div>

        {/* Trips List */}
        {displayedTrips.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-6 space-y-3">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">Chưa có tour nào ở mục này</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Bạn có thể tạo chuyến đi mới hoặc nhập mã mời từ các biker khác để cùng phượt!
            </p>
            <button
              onClick={handleCreateTripClick}
              className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              + Tạo Tour Mới Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTrips.map((trip) => {
              const isCreator = trip.createdBy === currentUser.id;
              const isActive = trip.status === 'active';
              const tourKm = getTripTotalKm(trip);
              const hasLeft = !trip.activeMemberIds.includes(currentUser.id);

              return (
                <div
                  key={trip.id}
                  className={`relative rounded-3xl border overflow-hidden transition-all duration-200 ${
                    hasLeft
                      ? 'bg-slate-950/60 border-slate-900 opacity-75'
                      : isActive
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                      : 'bg-slate-950/70 border-slate-900 opacity-80'
                  }`}
                >
                  {/* Tour Banner Preview */}
                  <div className="relative h-28 w-full overflow-hidden cursor-pointer" onClick={() => onSelectTrip(trip.id)}>
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 border border-slate-700">
                        #{trip.inviteCode}
                      </span>

                      {/* Status Badge */}
                      {hasLeft ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <span>Đã rời tour</span>
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/90 text-slate-950 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          <span>Đang diễn ra</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Đã hoàn thành</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h4 className="text-sm font-extrabold text-white truncate drop-shadow">
                        {trip.title}
                      </h4>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="truncate">{trip.departure} ➔ {trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body & Actions */}
                  <div className="p-3 space-y-2.5">
                    {/* Meta Info Row */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(trip.startDate)}</span>
                        </span>
                        <span>•</span>
                        <span>{getTripDates(trip.startDate, trip.endDate).length} Ngày ({tourKm} km)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{trip.activeMemberIds.length} Biker</span>
                      </div>
                    </div>

                    {/* Role & Creator indicator */}
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {isCreator ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
                            <span>👑 Bạn là Người tạo tour</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Trưởng đoàn: <strong className="text-slate-300">{trip.createdByName || 'Biker'}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Open Trip Button */}
                    <button
                      onClick={() => onSelectTrip(trip.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Vào Chi Tiết Lịch Trình & Sổ Quỹ</span>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
