import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateAIHashtags, shouldRegenerateHashtags } from '../lib/aiService';

// Fallback topics when AI is not available
const FALLBACK_TOPICS = [
    { id: 'dancetrend', tag: '#DansTrend', title: 'Dans Trendi', emoji: '💃', color: '#ec4899', category: 'dance' },
    { id: 'komedishow', tag: '#KomediShow', title: 'Komedi Gösterisi', emoji: '😂', color: '#f59e0b', category: 'comedy' },
    { id: 'yetenekzamani', tag: '#YetenekZamanı', title: 'Yetenek Zamanı', emoji: '🌟', color: '#8b5cf6', category: 'talent' },
    { id: 'lipsyncbattle', tag: '#LipSyncBattle', title: 'Lip Sync Savaşı', emoji: '🎤', color: '#3b82f6', category: 'music' },
    { id: 'sporchallenge', tag: '#SporChallenge', title: 'Spor Challenge', emoji: '💪', color: '#22c55e', category: 'sports' },
    { id: 'yemekshow', tag: '#YemekShow', title: 'Yemek Şovu', emoji: '🍕', color: '#ef4444', category: 'food' },
    { id: 'petmoments', tag: '#PetMoments', title: 'Evcil Hayvan Anları', emoji: '🐶', color: '#06b6d4', category: 'pets' },
    { id: 'artattack', tag: '#ArtAttack', title: 'Sanat Atağı', emoji: '🎨', color: '#a855f7', category: 'art' },
    { id: 'gunlukrutini', tag: '#GünlükRutin', title: 'Günlük Rutin', emoji: '☀️', color: '#fbbf24', category: 'lifestyle' },
    { id: 'makyajdegisimi', tag: '#MakyajDeğişimi', title: 'Makyaj Değişimi', emoji: '💄', color: '#f472b6', category: 'beauty' },
    { id: 'modatrend', tag: '#ModaTrend', title: 'Moda Trendi', emoji: '👗', color: '#c084fc', category: 'fashion' },
    { id: 'teknoloji', tag: '#TeknolojiAnı', title: 'Teknoloji Anı', emoji: '📱', color: '#60a5fa', category: 'tech' },
    { id: 'geziseyahat', tag: '#GeziSeyahat', title: 'Gezi & Seyahat', emoji: '✈️', color: '#34d399', category: 'travel' },
    { id: 'fitnessgoals', tag: '#FitnessGoals', title: 'Fitness Hedefleri', emoji: '🏋️', color: '#fb923c', category: 'fitness' },
    { id: 'muzikanlik', tag: '#MüzikAnlık', title: 'Müzik Anlık', emoji: '🎵', color: '#818cf8', category: 'music' },
];

// Get today's date string
const getTodayString = () => new Date().toDateString();

export const useHashtagStore = create(
    persist(
        (set, get) => ({
            dailyTopics: [],
            lastGeneratedDate: null,
            selectedHashtag: null,
            videoCounts: {},
            isLoading: false,
            isAIGenerated: false,

            // Initialize or refresh daily topics
            initializeDailyTopics: async () => {
                const { lastGeneratedDate, dailyTopics, videoCounts } = get();
                const today = getTodayString();

                // Already have today's topics
                if (lastGeneratedDate === today && dailyTopics.length > 0) {
                    return;
                }

                set({ isLoading: true });

                try {
                    // Try AI generation first
                    const aiTopics = await generateAIHashtags();

                    if (aiTopics && aiTopics.length >= 15) {
                        // Apply existing video counts
                        const topicsWithCounts = aiTopics.map(t => ({
                            ...t,
                            videoCount: videoCounts[t.id] || 0
                        }));

                        set({
                            dailyTopics: topicsWithCounts,
                            lastGeneratedDate: today,
                            isAIGenerated: true,
                            isLoading: false,
                        });

                        console.log('✨ AI-generated hashtags loaded!');
                        return;
                    }
                } catch (error) {
                    console.warn('AI generation failed, using fallback:', error);
                }

                // Fallback to static topics with date-based shuffle
                const today2 = new Date().toDateString();
                let seed = 0;
                for (let i = 0; i < today2.length; i++) {
                    seed += today2.charCodeAt(i);
                }

                const shuffled = [...FALLBACK_TOPICS].sort((a, b) => {
                    const hashA = (seed * a.id.charCodeAt(0)) % 1000;
                    const hashB = (seed * b.id.charCodeAt(0)) % 1000;
                    return hashA - hashB;
                });

                const topics = shuffled.map((topic, index) => ({
                    ...topic,
                    position: index + 1,
                    videoCount: videoCounts[topic.id] || 0,
                    trending: index < 3,
                    aiGenerated: false,
                }));

                set({
                    dailyTopics: topics,
                    lastGeneratedDate: today,
                    isAIGenerated: false,
                    isLoading: false,
                });
            },

            // Force regenerate with AI
            regenerateWithAI: async () => {
                set({ isLoading: true });

                try {
                    const aiTopics = await generateAIHashtags();

                    if (aiTopics && aiTopics.length >= 15) {
                        const { videoCounts } = get();
                        const topicsWithCounts = aiTopics.map(t => ({
                            ...t,
                            videoCount: videoCounts[t.id] || 0
                        }));

                        set({
                            dailyTopics: topicsWithCounts,
                            lastGeneratedDate: getTodayString(),
                            isAIGenerated: true,
                            isLoading: false,
                        });

                        return true;
                    }
                } catch (error) {
                    console.error('AI regeneration failed:', error);
                }

                set({ isLoading: false });
                return false;
            },

            // Update video counts from real data
            updateVideoCounts: (videos) => {
                const counts = {};
                videos.forEach(video => {
                    if (video.hashtagId) {
                        counts[video.hashtagId] = (counts[video.hashtagId] || 0) + 1;
                    }
                });

                set((state) => ({
                    videoCounts: counts,
                    dailyTopics: state.dailyTopics.map(topic => ({
                        ...topic,
                        videoCount: counts[topic.id] || 0,
                    }))
                }));
            },

            // Get all daily topics
            getDailyTopics: () => {
                const { dailyTopics, lastGeneratedDate } = get();
                const today = getTodayString();

                // Trigger initialization if needed (async)
                if (lastGeneratedDate !== today || dailyTopics.length === 0) {
                    get().initializeDailyTopics();
                }

                return dailyTopics;
            },

            // Get trending topics (top 3)
            getTrendingTopics: () => {
                const { dailyTopics } = get();
                // Sort by video count descending, then by position to keep consistent tie-breaking
                return [...dailyTopics]
                    .sort((a, b) => {
                        const countDiff = (b.videoCount || 0) - (a.videoCount || 0);
                        if (countDiff !== 0) return countDiff;
                        return (a.position || 0) - (b.position || 0);
                    })
                    .slice(0, 3);
            },

            // Select hashtag for filtering
            selectHashtag: (hashtagId) => {
                set({ selectedHashtag: hashtagId });
            },

            // Clear selection
            clearSelection: () => {
                set({ selectedHashtag: null });
            },

            // Get topic by ID
            getTopicById: (id) => {
                return get().dailyTopics.find(t => t.id === id);
            },

            // Get real video count for a hashtag
            getRealVideoCount: (hashtagId) => {
                return get().videoCounts[hashtagId] || 0;
            },

            // Reset all counts
            resetCounts: () => {
                set((state) => ({
                    videoCounts: {},
                    dailyTopics: state.dailyTopics.map(topic => ({
                        ...topic,
                        videoCount: 0,
                    }))
                }));
            },

            // Increment video count for a hashtag (called after video upload)
            incrementVideoCount: (hashtagId) => {
                set((state) => ({
                    videoCounts: {
                        ...state.videoCounts,
                        [hashtagId]: (state.videoCounts[hashtagId] || 0) + 1
                    },
                    dailyTopics: state.dailyTopics.map(topic =>
                        topic.id === hashtagId
                            ? { ...topic, videoCount: (topic.videoCount || 0) + 1 }
                            : topic
                    )
                }));
            },
        }),
        {
            name: 'doit-hashtag-storage',
            partialize: (state) => ({
                dailyTopics: state.dailyTopics,
                lastGeneratedDate: state.lastGeneratedDate,
                isAIGenerated: state.isAIGenerated,
                // videoCounts is not persisted - fetched fresh from Supabase
            }),
        }
    )
);
