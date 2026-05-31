import { useStreakStore } from '../streakStore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

describe('StreakStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useStreakStore.getState().resetStreak();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { currentStreak, bestStreak, lastCheckDate, achievements } = useStreakStore.getState();

    expect(currentStreak).toBe(0);
    expect(bestStreak).toBe(0);
    expect(lastCheckDate).toBeNull();
    expect(achievements).toEqual([]);
  });

  it('should reset streak correctly', () => {
    useStreakStore.setState({ currentStreak: 5, bestStreak: 10, lastCheckDate: new Date().toDateString() });
    useStreakStore.getState().resetStreak();

    const { currentStreak, lastCheckDate } = useStreakStore.getState();

    expect(currentStreak).toBe(0);
    expect(lastCheckDate).toBeNull();
  });

  it('should unlock achievement', () => {
    useStreakStore.getState().unlockAchievement('first_3_days');

    const { achievements } = useStreakStore.getState();

    expect(achievements).toContain('first_3_days');
  });

  it('should not add duplicate achievements', () => {
    useStreakStore.getState().unlockAchievement('first_3_days');
    useStreakStore.getState().unlockAchievement('first_3_days');

    const { achievements } = useStreakStore.getState();

    expect(achievements.filter(a => a === 'first_3_days').length).toBe(1);
  });

  it('should unlock achievement at day 3', async () => {
    const { unlockAchievement } = useStreakStore.getState();
    const unlockSpy = jest.spyOn(useStreakStore.getState(), 'unlockAchievement');

    unlockSpy.mockImplementation((achievementId) => {
      useStreakStore.setState((state) => ({
        achievements: [...new Set([...state.achievements, achievementId])]),
      }));
    });

    const checkIn = useStreakStore.getState().checkIn;

    await checkIn();
    await checkIn();
    await checkIn();

    const { achievements } = useStreakStore.getState();

    expect(achievements).toContain('first_3_days');

    unlockSpy.mockRestore();
  });

  it('should calculate daily progress correctly', () => {
    const { getDailyProgress } = useStreakStore.getState();

    expect(getDailyProgress()).toBe(0);

    const today = new Date().toDateString();
    useStreakStore.setState({ lastCheckDate: today });

    expect(getDailyProgress()).toBe(100);
  });

  it('should update bestStreak correctly', async () => {
    const checkIn = useStreakStore.getState().checkIn;

    await checkIn();
    await checkIn();
    await checkIn();

    const { currentStreak, bestStreak } = useStreakStore.getState();

    expect(currentStreak).toBe(3);
    expect(bestStreak).toBe(3);
  });

  it('should handle check-in on consecutive days', async () => {
    const checkIn = useStreakStore.getState().checkIn;

    await checkIn();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    useStreakStore.setState({ lastCheckDate: yesterday.toDateString() });

    await checkIn();

    const { currentStreak } = useStreakStore.getState();
    expect(currentStreak).toBe(2);
  });
});
