import { Trip, UserProfile } from '../types/trip';

export const DEFAULT_CURRENT_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  phone: '',
  vehicle: '',
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountName: '',
  isLoggedIn: false,
  authProvider: 'google',
};

// Không còn dữ liệu nháp về tour hay biker
export const INITIAL_TRIPS: Trip[] = [];
