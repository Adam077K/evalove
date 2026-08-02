import { create } from 'zustand';
import type { WarRoomState } from './lib/types';

interface DashboardStore extends WarRoomState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  setState: (state: WarRoomState) => void;
}

export const useStore = create<DashboardStore>((set) => ({
  isConnected: false,
  isRunning: false,
  ceos: [],
  totalCostUsd: 0,
  recentCommits: [],
  fileConflicts: [],
  recentEvents: [],
  setConnected: (connected) => set({ isConnected: connected }),
  setState: (state) => set(state),
}));
