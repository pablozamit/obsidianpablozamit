import { useStreakStore } from '../store/streakStore';

// Mock Firebase auth
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
  },
  db: {},
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('Streak Store', () => {
  beforeEach(() => {
    useStreakStore.setState({
      currentStreak: 0,
      bestStreak: 0,
      lastCheckDate: null,
      achievements: [],
    });
  });

  test('initial state', () => {
    const state = useStreakStore.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.lastCheckDate).toBeNull();
    expect(state.achievements).toEqual([]);
  });

  test('checkIn increases streak', () => {
    const { checkIn } = useStreakStore.getState();
    
    checkIn();
    
    const state = useStreakStore.getState();
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(1);
    expect(state.lastCheckDate).toBe(new Date().toDateString());
  });

  test('checkIn on same day does nothing', () => {
    const today = new Date().toDateString();
    useStreakStore.setState({ lastCheckDate: today });
    
    const { checkIn } = useStreakStore.getState();
    checkIn();
    
    const state = useStreakStore.getState();
    expect(state.currentStreak).toBe(0); // Should not change
  });

  test('consecutive checkIn increases streak', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    useStreakStore.setState({
      currentStreak: 2,
      lastCheckDate: yesterday.toDateString(),
    });
    
    const { checkIn } = useStreakStore.getState();
    checkIn();
    
    const state = useStreakStore.getState();
    expect(state.currentStreak).toBe(3);
  });

  test('non-consecutive checkIn resets streak', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    useStreakStore.setState({
      currentStreak: 5,
      lastCheckDate: twoDaysAgo.toDateString(),
    });
    
    const { checkIn } = useStreakStore.getState();
    checkIn();
    
    const state = useStreakStore.getState();
    expect(state.currentStreak).toBe(1); // Reset to 1
  });

  test('unlockAchievement adds achievement', () => {
    const { unlockAchievement } = useStreakStore.getState();
    
    unlockAchievement('test_achievement');
    
    const state = useStreakStore.getState();
    expect(state.achievements).toContain('test_achievement');
  });

  test('getDailyProgress returns correct values', () => {
    const { getDailyProgress } = useStreakStore.getState();
    
    expect(getDailyProgress()).toBe(0); // Not checked in today
    
    useStreakStore.setState({ lastCheckDate: new Date().toDateString() });
    expect(getDailyProgress()).toBe(100); // Checked in today
  });
});