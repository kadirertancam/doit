import { create } from 'zustand';

// Arena store for swipe voting system
export const useArenaStore = create((set, get) => ({
    currentIndex: 0,
    videos: [],
    votesGiven: 0,
    upvotes: 0,
    downvotes: 0,
    skipped: 0,
    isLoading: false,

    // Initialize arena with videos
    initializeArena: (submissions) => {
        set({
            videos: submissions,
            currentIndex: 0,
            votesGiven: 0,
            upvotes: 0,
            downvotes: 0,
            skipped: 0,
        });
    },

    // Get current video
    getCurrentVideo: () => {
        const { videos, currentIndex } = get();
        return videos[currentIndex] || null;
    },

    // Upvote current video
    upvote: (onComplete) => {
        const { currentIndex, videos, votesGiven, upvotes } = get();

        if (currentIndex >= videos.length) return;

        const nextIndex = Math.min(currentIndex + 1, videos.length);

        set({
            currentIndex: nextIndex,
            votesGiven: votesGiven + 1,
            upvotes: upvotes + 1,
        });

        if (onComplete) {
            onComplete('upvote', videos[currentIndex]);
        }
    },

    // Downvote current video
    downvote: (onComplete) => {
        const { currentIndex, videos, votesGiven, downvotes } = get();

        if (currentIndex >= videos.length) return;

        const nextIndex = Math.min(currentIndex + 1, videos.length);

        set({
            currentIndex: nextIndex,
            votesGiven: votesGiven + 1,
            downvotes: downvotes + 1,
        });

        if (onComplete) {
            onComplete('downvote', videos[currentIndex]);
        }
    },

    // Skip to next video (swipe left)
    nextVideo: () => {
        const { currentIndex, videos, skipped } = get();

        if (currentIndex >= videos.length - 1) return;

        set({
            currentIndex: currentIndex + 1,
            skipped: skipped + 1,
        });
    },

    // Go to previous video (swipe right)
    prevVideo: () => {
        const { currentIndex } = get();

        if (currentIndex <= 0) return;

        set({
            currentIndex: currentIndex - 1,
        });
    },

    // Get remaining count
    getRemainingCount: () => {
        const { videos, currentIndex } = get();
        return Math.max(0, videos.length - currentIndex);
    },

    // Reset arena
    resetArena: () => {
        set({
            currentIndex: 0,
            votesGiven: 0,
            upvotes: 0,
            downvotes: 0,
            skipped: 0,
        });
    },

    // Get stats
    getStats: () => {
        const { votesGiven, upvotes, downvotes, skipped } = get();
        return { votesGiven, upvotes, downvotes, skipped };
    },
}));
