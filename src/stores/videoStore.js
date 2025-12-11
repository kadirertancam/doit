import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useVideoStore = create((set, get) => ({
    videos: [],
    userVotedVideoIds: [], // Track videos voted by current user
    isLoading: false,
    votesLoading: true, // New state to track if votes are loaded
    error: null,
    lastFetchTime: null, // Cache timestamp to prevent redundant fetches
    CACHE_DURATION: 30000, // 30 seconds cache

    lastVotesFetchUserId: null, // Track which user's votes are cached

    // Fetch videos voted by user (with cache)
    fetchUserVotes: async (userId) => {
        const { lastVotesFetchUserId, userVotedVideoIds, votesLoading } = get();

        // Skip if already loading or same user's votes are cached
        if (votesLoading === false && lastVotesFetchUserId === userId && userVotedVideoIds.length >= 0) {
            return;
        }

        set({ votesLoading: true });
        try {
            const { data, error } = await supabase
                .from('votes')
                .select('video_id')
                .eq('user_id', userId);

            if (error) throw error;

            const votedIds = data.map(v => v.video_id);
            set({ userVotedVideoIds: votedIds, votesLoading: false, lastVotesFetchUserId: userId });
        } catch (error) {
            console.error('Error fetching user votes:', error);
            set({ votesLoading: false });
        }
    },

    // Fetch all videos from Supabase (with cache)
    fetchVideos: async (force = false) => {
        const { lastFetchTime, CACHE_DURATION, videos, isLoading } = get();
        const now = Date.now();

        // Skip if already loading
        if (isLoading) return;

        // Skip if cache is still valid and not forcing refresh
        if (!force && lastFetchTime && videos.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            return;
        }

        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('videos')
                .select(`
          *,
          profiles:user_id (username, display_name, avatar_url),
          comments (
            id, 
            text, 
            user_id, 
            created_at,
            profiles:user_id (username, display_name, avatar_url)
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data for compatibility
            const videos = (data || []).map(v => ({
                id: v.id,
                userId: v.user_id,
                username: v.profiles?.username || 'user',
                displayName: v.profiles?.display_name || 'User',
                avatarUrl: v.profiles?.avatar_url,
                videoUrl: v.video_url,
                thumbnailUrl: v.thumbnail_url || `https://picsum.photos/seed/${v.id}/400/600`,
                hashtagId: v.hashtag_id,
                votes: v.votes || 0,
                arenaPoints: v.arena_points || 0,
                comments: (v.comments || []).map(c => ({
                    id: c.id,
                    userId: c.user_id,
                    username: c.profiles?.username || 'user',
                    text: c.text,
                    createdAt: c.created_at
                })),
                createdAt: v.created_at,
            }));

            set({ videos, isLoading: false, lastFetchTime: Date.now() });
        } catch (error) {
            console.error('Error fetching videos:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Get all videos (from state)
    getAllVideos: () => get().videos,

    // Get videos by hashtag
    getVideosByHashtag: (hashtagId) => {
        return get().videos.filter(v => v.hashtagId === hashtagId);
    },

    // Get actual video count by hashtag
    getVideoCountByHashtag: (hashtagId) => {
        return get().videos.filter(v => v.hashtagId === hashtagId).length;
    },

    // Get video by ID
    getVideoById: (id) => {
        return get().videos.find(v => v.id === id);
    },

    // Add new video
    addVideo: async (videoData) => {
        try {
            // Validate required fields
            if (!videoData.userId) {
                throw new Error('User ID is required to upload a video');
            }

            const { data, error } = await supabase
                .from('videos')
                .insert({
                    user_id: videoData.userId,
                    hashtag_id: videoData.hashtagId || null,
                    video_url: videoData.url || null,
                    thumbnail_url: videoData.thumbnail || `https://picsum.photos/seed/${Date.now()}/400/600`,
                    votes: 0,
                    arena_points: 0,
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            const newVideo = {
                id: data.id,
                userId: data.user_id,
                username: 'challenger',
                displayName: 'Challenger',
                videoUrl: data.video_url,
                thumbnailUrl: data.thumbnail_url,
                hashtagId: data.hashtag_id,
                votes: 0,
                arenaPoints: 0,
                comments: [],
                createdAt: data.created_at,
            };

            set((state) => ({
                videos: [newVideo, ...state.videos]
            }));

            return { success: true, video: newVideo };
        } catch (error) {
            console.error('Error adding video:', error);
            return { success: false, error: error.message };
        }
    },

    // Upvote video
    upvoteVideo: async (videoId, userId) => {
        try {
            const video = get().getVideoById(videoId);
            if (!video) return;

            // 1. Insert into votes table
            const { error: voteError } = await supabase
                .from('votes')
                .insert({
                    video_id: videoId,
                    user_id: userId,
                    vote_type: 'up',
                    is_arena_vote: true
                });

            if (voteError) {
                // Ignore unique constraint violation (already voted)
                if (voteError.code !== '23505') throw voteError;
            }

            // 2. Update video vote count
            const { error: videoError } = await supabase
                .from('videos')
                .update({ votes: video.votes + 1 })
                .eq('id', videoId);

            if (videoError) throw videoError;

            set((state) => ({
                videos: state.videos.map(v =>
                    v.id === videoId ? { ...v, votes: v.votes + 1 } : v
                ),
                userVotedVideoIds: [...state.userVotedVideoIds, videoId]
            }));
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    },

    // Downvote video
    downvoteVideo: async (videoId, userId) => {
        try {
            const video = get().getVideoById(videoId);
            if (!video) return;

            // 1. Insert into votes table
            const { error: voteError } = await supabase
                .from('votes')
                .insert({
                    video_id: videoId,
                    user_id: userId,
                    vote_type: 'down',
                    is_arena_vote: true
                });

            if (voteError) {
                // Ignore unique constraint violation (already voted)
                if (voteError.code !== '23505') throw voteError;
            }

            // 2. Update video vote count (optional: decrement or just track)
            // For now, let's say downvote decrements score or just tracks it. 
            // The original logic was decrementing.
            const newVotes = Math.max(0, video.votes - 1);

            const { error: videoError } = await supabase
                .from('videos')
                .update({ votes: newVotes })
                .eq('id', videoId);

            if (videoError) throw videoError;

            set((state) => ({
                videos: state.videos.map(v =>
                    v.id === videoId ? { ...v, votes: newVotes } : v
                ),
                userVotedVideoIds: [...state.userVotedVideoIds, videoId]
            }));
        } catch (error) {
            console.error('Error downvoting:', error);
        }
    },

    // Add arena points to video owner
    addArenaPoints: async (videoId, points = 10) => {
        try {
            const video = get().getVideoById(videoId);
            if (!video) return;

            const { error } = await supabase
                .from('videos')
                .update({ arena_points: video.arenaPoints + points })
                .eq('id', videoId);

            if (error) throw error;

            set((state) => ({
                videos: state.videos.map(v =>
                    v.id === videoId ? { ...v, arenaPoints: v.arenaPoints + points } : v
                )
            }));
        } catch (error) {
            console.error('Error adding arena points:', error);
        }
    },

    // Add comment
    addComment: async (videoId, text, userId, username) => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    video_id: videoId,
                    user_id: userId,
                    text,
                })
                .select()
                .single();

            if (error) throw error;

            const comment = {
                id: data.id,
                userId: data.user_id,
                username: username || 'user',
                text: data.text,
                createdAt: data.created_at,
            };

            set((state) => ({
                videos: state.videos.map(v =>
                    v.id === videoId
                        ? { ...v, comments: [...v.comments, comment] }
                        : v
                )
            }));

            return { success: true, comment };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete video
    deleteVideo: async (videoId) => {
        try {
            const { error, count } = await supabase
                .from('videos')
                .delete({ count: 'exact' })
                .eq('id', videoId);

            if (error) throw error;

            // Check if a row was actually deleted
            if (count === 0) {
                throw new Error('Video could not be deleted. Check permissions.');
            }

            set((state) => ({
                videos: state.videos.filter(v => v.id !== videoId)
            }));

            return { success: true };
        } catch (error) {
            console.error('Error deleting video:', error);
            return { success: false, error: error.message };
        }
    },

    // Get top videos
    getTopVideos: (limit = 10, hashtagId = null) => {
        let videos = get().videos;

        if (hashtagId) {
            videos = videos.filter(v => v.hashtagId === hashtagId);
        }

        return [...videos]
            .sort((a, b) => (b.votes + b.arenaPoints) - (a.votes + a.arenaPoints))
            .slice(0, limit);
    },
}));
