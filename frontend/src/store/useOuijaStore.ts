import { create } from 'zustand';
import type { Spirit, OuijaSession, SessionMessage, User } from '../types';

interface OuijaState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Spirits
  spirits: Spirit[];
  selectedSpirit: Spirit | null;
  setSpirits: (spirits: Spirit[]) => void;
  setSelectedSpirit: (spirit: Spirit | null) => void;

  // Session
  currentSession: OuijaSession | null;
  sessionMessages: SessionMessage[];
  setCurrentSession: (session: OuijaSession | null) => void;
  addMessage: (message: SessionMessage) => void;
  setMessages: (messages: SessionMessage[]) => void;
  clearSession: () => void;

  // UI State
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  setConnecting: (isConnecting: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOuijaStore = create<OuijaState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Spirits
  spirits: [],
  selectedSpirit: null,
  setSpirits: (spirits) => set({ spirits }),
  setSelectedSpirit: (spirit) => set({ selectedSpirit: spirit }),

  // Session
  currentSession: null,
  sessionMessages: [],
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => ({
      sessionMessages: [...state.sessionMessages, message],
    })),
  setMessages: (messages) => set({ sessionMessages: messages }),
  clearSession: () =>
    set({
      currentSession: null,
      sessionMessages: [],
      selectedSpirit: null,
    }),

  // UI State
  isConnecting: false,
  isLoading: false,
  error: null,
  setConnecting: (isConnecting) => set({ isConnecting }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
