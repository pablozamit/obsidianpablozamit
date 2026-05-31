import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastCheckDate: string | null;
  achievements: string[];
  
  // Actions
  checkIn: () => void;
  resetStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  getDailyProgress: () => number;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      bestStreak: 0,
      lastCheckDate: null,
      achievements: [],

      checkIn: async () => {
        const today = new Date().toDateString();
        const { lastCheckDate, currentStreak, bestStreak } = get();

        if (lastCheckDate === today) {
          return; // Already checked in today
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isConsecutive = lastCheckDate === yesterday.toDateString();
        const newStreak = isConsecutive ? currentStreak + 1 : 1;

        set({
          currentStreak: newStreak,
          bestStreak: Math.max(bestStreak, newStreak),
          lastCheckDate: today,
        });

        // Unlock achievements
        const { unlockAchievement } = get();
        if (newStreak === 3) unlockAchievement('first_3_days');
        if (newStreak === 7) unlockAchievement('first_week');
        if (newStreak === 14) unlockAchievement('two_weeks');
        if (newStreak === 30) unlockAchievement('one_month');

        // Sync with Firebase
        await syncStreakToFirebase();
      },

      resetStreak: () => {
        set({
          currentStreak: 0,
          lastCheckDate: null,
        });
      },

      unlockAchievement: (achievementId: string) => {
        set((state) => ({
          achievements: [...new Set([...state.achievements, achievementId])],
        }));
      },

      getDailyProgress: () => {
        const { lastCheckDate } = get();
        const today = new Date().toDateString();
        return lastCheckDate === today ? 100 : 0;
      },
    }),
    {
      name: 'streak-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => async (state) => {
        if (state && auth.currentUser) {
          await loadStreakFromFirebase();
        }
      },
    }
  )
);

// Firebase sync functions
const syncStreakToFirebase = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const streakState = useStreakStore.getState();
    const streakRef = doc(db, 'users', user.uid, 'streak', 'current');
    
    await setDoc(streakRef, {
      currentStreak: streakState.currentStreak,
      bestStreak: streakState.bestStreak,
      lastCheckDate: streakState.lastCheckDate,
      achievements: streakState.achievements,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error syncing streak to Firebase:', error);
  }
};

const loadStreakFromFirebase = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const streakRef = doc(db, 'users', user.uid, 'streak', 'current');
    const streakDoc = await getDoc(streakRef);
    
    if (streakDoc.exists()) {
      const data = streakDoc.data();
      useStreakStore.setState({
        currentStreak: data.currentStreak || 0,
        bestStreak: data.bestStreak || 0,
        lastCheckDate: data.lastCheckDate || null,
        achievements: data.achievements || [],
      });
    }
  } catch (error) {
    console.error('Error loading streak from Firebase:', error);
  }
};
