import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock user data
const INITIAL_USER = {
    id: 'user_1',
    username: 'challenger',
    displayName: 'Challenger',
    avatar: null,
    level: 5,
    xp: 2450,
    xpToNextLevel: 3000,
    totalWins: 12,
    totalParticipations: 45,
    currentStreak: 3,
    longestStreak: 7,
    badges: ['first_win', 'streak_3', 'top_10'],
    joinedAt: new Date().toISOString(),
};

// XP rewards
const XP_REWARDS = {
    PARTICIPATE: 50,
    WIN_VOTE: 10,
    DAILY_WIN: 500,
    STREAK_BONUS: 25,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
    0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000,
    21000, 27000, 34000, 42000, 51000, 61000, 72000, 84000, 97000, 111000
];

export const useUserStore = create(
    persist(
        (set, get) => ({
            user: INITIAL_USER,
            isLoggedIn: true,

            // Calculate level from XP
            calculateLevel: (xp) => {
                for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
                    if (xp >= LEVEL_THRESHOLDS[i]) {
                        return {
                            level: i + 1,
                            xpToNextLevel: LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] + 15000,
                            xpForCurrentLevel: LEVEL_THRESHOLDS[i]
                        };
                    }
                }
                return { level: 1, xpToNextLevel: 500, xpForCurrentLevel: 0 };
            },

            // Add XP
            addXP: (amount) => {
                set((state) => {
                    const newXP = state.user.xp + amount;
                    const levelInfo = get().calculateLevel(newXP);

                    return {
                        user: {
                            ...state.user,
                            xp: newXP,
                            level: levelInfo.level,
                            xpToNextLevel: levelInfo.xpToNextLevel,
                        }
                    };
                });
            },

            // Add participation
            addParticipation: () => {
                set((state) => ({
                    user: {
                        ...state.user,
                        totalParticipations: state.user.totalParticipations + 1,
                    }
                }));
                get().addXP(XP_REWARDS.PARTICIPATE);
            },

            // Add win
            addWin: () => {
                set((state) => ({
                    user: {
                        ...state.user,
                        totalWins: state.user.totalWins + 1,
                    }
                }));
                get().addXP(XP_REWARDS.DAILY_WIN);
            },

            // Update streak
            updateStreak: (isNewDay) => {
                set((state) => {
                    if (isNewDay) {
                        const newStreak = state.user.currentStreak + 1;
                        const longestStreak = Math.max(newStreak, state.user.longestStreak);

                        get().addXP(XP_REWARDS.STREAK_BONUS * newStreak);

                        return {
                            user: {
                                ...state.user,
                                currentStreak: newStreak,
                                longestStreak,
                            }
                        };
                    }
                    return {
                        user: { ...state.user, currentStreak: 0 }
                    };
                });
            },

            // Add badge
            addBadge: (badgeId) => {
                set((state) => {
                    if (state.user.badges.includes(badgeId)) return state;
                    return {
                        user: {
                            ...state.user,
                            badges: [...state.user.badges, badgeId],
                        }
                    };
                });
            },

            // Update profile
            updateProfile: (updates) => {
                set((state) => ({
                    user: { ...state.user, ...updates }
                }));
            },
        }),
        {
            name: 'doit-user-storage',
        }
    )
);
