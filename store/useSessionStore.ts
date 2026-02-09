import { create } from 'zustand';
import { CashSessionStatus } from '../types';

interface SessionState {
  // Org Context
  orgId: string;
  branchId: string;
  
  // User Context
  userId: string | null;
  userName: string | null;
  
  // Cash Session Context
  activeSessionId: string | null;
  sessionStatus: CashSessionStatus;
  
  // System Status
  isOnline: boolean;
  
  // Actions
  setOrg: (orgId: string, branchId: string) => void;
  setUser: (userId: string, userName: string) => void;
  setCashSession: (sessionId: string | null, status: CashSessionStatus) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

// Mock initial data for development
export const useSessionStore = create<SessionState>((set) => ({
  orgId: 'org-default-uuid',
  branchId: 'warehouse-default-uuid',
  
  userId: 'user-default-uuid',
  userName: 'Admin User',
  
  activeSessionId: null,
  sessionStatus: CashSessionStatus.CLOSED,
  
  isOnline: navigator.onLine,
  
  setOrg: (orgId, branchId) => set({ orgId, branchId }),
  setUser: (userId, userName) => set({ userId, userName }),
  setCashSession: (activeSessionId, sessionStatus) => set({ activeSessionId, sessionStatus }),
  setOnlineStatus: (isOnline) => set({ isOnline }),
}));

// Listener for network status
window.addEventListener('online', () => useSessionStore.getState().setOnlineStatus(true));
window.addEventListener('offline', () => useSessionStore.getState().setOnlineStatus(false));
