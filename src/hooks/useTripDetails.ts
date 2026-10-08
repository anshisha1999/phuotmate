import { useEffect, useState } from 'react';
import { Expense, ItineraryCard, Member, Payment, TripDetails } from '../types/trip';
import { subscribeToTripCollection } from '../services/firebase';

const EMPTY_DETAILS: TripDetails = { members: [], cards: [], expenses: [], payments: [] };

/**
 * Lắng nghe realtime thành viên, lịch trình, chi phí và thanh toán của tour đang xem.
 * Mọi thay đổi từ máy khác được cập nhật ngay.
 */
export function useTripDetails(tripId: string | null): TripDetails {
  const [details, setDetails] = useState<TripDetails>(EMPTY_DETAILS);

  useEffect(() => {
    setDetails(EMPTY_DETAILS);
    if (!tripId) return;

    const onError = (err: Error) => console.warn('Realtime tour listener:', err.message);
    const unsubs = [
      subscribeToTripCollection<Member>(tripId, 'members', (members) =>
        setDetails((prev) => ({ ...prev, members: [...members].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)) })), onError),
      subscribeToTripCollection<ItineraryCard>(tripId, 'cards', (cards) =>
        setDetails((prev) => ({ ...prev, cards })), onError),
      subscribeToTripCollection<Expense>(tripId, 'expenses', (expenses) =>
        setDetails((prev) => ({ ...prev, expenses: [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })), onError),
      subscribeToTripCollection<Payment>(tripId, 'payments', (payments) =>
        setDetails((prev) => ({ ...prev, payments: [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })), onError),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [tripId]);

  return details;
}
