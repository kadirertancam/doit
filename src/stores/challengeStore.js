import { create } from 'zustand';

// Mock challenge categories
const CHALLENGE_CATEGORIES = [
    { id: 'dance', name: 'Dans', emoji: '💃', color: '#ec4899' },
    { id: 'comedy', name: 'Komedi', emoji: '😂', color: '#f59e0b' },
    { id: 'talent', name: 'Yetenek', emoji: '🌟', color: '#8b5cf6' },
    { id: 'lip_sync', name: 'Lip Sync', emoji: '🎤', color: '#3b82f6' },
    { id: 'sport', name: 'Spor', emoji: '⚽', color: '#22c55e' },
    { id: 'food', name: 'Yemek', emoji: '🍕', color: '#ef4444' },
    { id: 'pet', name: 'Evcil Hayvan', emoji: '🐶', color: '#06b6d4' },
    { id: 'creative', name: 'Yaratıcı', emoji: '🎨', color: '#a855f7' },
];

// Mock daily challenges
const generateDailyChallenge = () => {
    const category = CHALLENGE_CATEGORIES[Math.floor(Math.random() * CHALLENGE_CATEGORIES.length)];
    const challengeTemplates = {
        dance: [
            'Kendine özgü dans hareketinle bizi eğlendir!',
            'Evdeki eşyalarla dans koreografisi yap!',
            'Yavaş çekimde dans challenge!',
        ],
        comedy: [
            'En komik yüz ifadeni göster!',
            'Sessiz film challenge - konuşmadan hikaye anlat!',
            'Dublaj challenge - bir sahneyi kendin seslendir!',
        ],
        talent: [
            'Gizli yeteneğini 6 saniyede göster!',
            'El becerisi challenge!',
            'Taklit yeteneğini konuştur!',
        ],
        lip_sync: [
            'Favori şarkına lip sync yap!',
            'Film repliği lip sync challenge!',
            'Duygusal şarkı lip sync!',
        ],
        sport: [
            'Freestyle trick challenge!',
            'Fitness hareketi challenge!',
            'Top becerisi göster!',
        ],
        food: [
            'En hızlı yeme challenge!',
            'Yiyecek reaksiyonu challenge!',
            'Yaratıcı yemek sunumu!',
        ],
        pet: [
            'Evcil hayvanınla eğlenceli anlar!',
            'Pet trick challenge!',
            'Evcil hayvan reaksiyon videosu!',
        ],
        creative: [
            '6 saniyede sanat eseri yap!',
            'Dönüşüm challenge - önce/sonra!',
            'Optik illüzyon challenge!',
        ],
    };

    const templates = challengeTemplates[category.id];
    const title = templates[Math.floor(Math.random() * templates.length)];

    // Calculate end of day
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return {
        id: `challenge_${Date.now()}`,
        title,
        category,
        startTime: now.toISOString(),
        endTime: endOfDay.toISOString(),
        participantCount: Math.floor(Math.random() * 500) + 100,
        maxDuration: 6, // 6 seconds
    };
};

// Mock submissions
const generateMockSubmissions = (count = 20) => {
    const usernames = ['Ali', 'Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Selin', 'Emre', 'Deniz'];

    return Array.from({ length: count }, (_, i) => ({
        id: `submission_${i + 1}`,
        oderId: `user_${i + 1}`,
        username: usernames[i % usernames.length],
        displayName: usernames[i % usernames.length],
        videoUrl: null, // Would be actual video URL
        thumbnailUrl: `https://picsum.photos/seed/${i}/400/600`,
        votes: Math.floor(Math.random() * 1000),
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }));
};

export const useChallengeStore = create((set, get) => ({
    currentChallenge: generateDailyChallenge(),
    submissions: generateMockSubmissions(),
    userSubmission: null,
    previousWinners: [],
    isLoading: false,

    // Refresh challenge (called at midnight or on app load)
    refreshChallenge: () => {
        const challenge = generateDailyChallenge();
        set({
            currentChallenge: challenge,
            submissions: generateMockSubmissions(),
            userSubmission: null,
        });
    },

    // Submit video
    submitVideo: (videoData) => {
        const { currentChallenge } = get();

        const submission = {
            id: `submission_${Date.now()}`,
            oderId: 'user_1',
            username: 'challenger',
            displayName: 'Challenger',
            videoUrl: videoData.url,
            thumbnailUrl: videoData.thumbnail,
            votes: 0,
            createdAt: new Date().toISOString(),
            challengeId: currentChallenge.id,
        };

        set((state) => ({
            userSubmission: submission,
            submissions: [submission, ...state.submissions],
            currentChallenge: {
                ...state.currentChallenge,
                participantCount: state.currentChallenge.participantCount + 1,
            }
        }));

        return submission;
    },

    // Get top submissions
    getTopSubmissions: (limit = 10) => {
        const { submissions } = get();
        return [...submissions].sort((a, b) => b.votes - a.votes).slice(0, limit);
    },

    // Add vote to submission
    addVote: (submissionId) => {
        set((state) => ({
            submissions: state.submissions.map(sub =>
                sub.id === submissionId
                    ? { ...sub, votes: sub.votes + 1 }
                    : sub
            )
        }));
    },

    // Get time remaining
    getTimeRemaining: () => {
        const { currentChallenge } = get();
        const endTime = new Date(currentChallenge.endTime);
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

        return {
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
    },
}));
