import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ThumbsUp, ThumbsDown, RotateCcw, Hash, ChevronDown, Award, Loader, Video, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHashtagStore } from '../stores/hashtagStore';
import { useVideoStore } from '../stores/videoStore';
import { useArenaStore } from '../stores/arenaStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { ArenaCard } from '../components/Arena';
import './Arena.css';

function Arena() {
    const navigate = useNavigate();
    const { getDailyTopics, getTopicById, updateVideoCounts } = useHashtagStore();
    const { getVideosByHashtag, getAllVideos, addArenaPoints, fetchVideos, videos, isLoading, fetchUserVotes, userVotedVideoIds, votesLoading, upvoteVideo, downvoteVideo } = useVideoStore();
    const {
        getCurrentVideo,
        initializeArena,
        upvote,
        downvote,
        nextVideo,
        prevVideo,
        currentIndex,
        videos: arenaVideos,
        upvotes,
        downvotes,
        votesGiven,
        resetArena
    } = useArenaStore();
    const { addXP, user } = useUserStore();
    const { isAuthenticated, profile } = useAuthStore();

    const [selectedHashtag, setSelectedHashtag] = useState(null);
    const [showHashtagPicker, setShowHashtagPicker] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const dailyTopics = getDailyTopics();
    const selectedTopic = selectedHashtag ? getTopicById(selectedHashtag) : null;

    // Fetch videos on mount
    useEffect(() => {
        fetchVideos();
    }, []);

    // Fetch user votes if authenticated
    useEffect(() => {
        if (isAuthenticated && profile?.id) {
            fetchUserVotes(profile.id);
        }
    }, [isAuthenticated, profile]);

    // Update video counts when videos change
    useEffect(() => {
        if (videos.length > 0) {
            updateVideoCounts(videos);
        }
    }, [videos, updateVideoCounts]);

    // Initialize arena only once when videos are loaded
    useEffect(() => {
        // Skip if already initialized or still loading
        if (initialized || isLoading || videos.length === 0) return;

        // Wait for votes to load if user is authenticated
        if (isAuthenticated && votesLoading) return;

        let videoList = selectedHashtag ? getVideosByHashtag(selectedHashtag) : getAllVideos();

        // Filter out voted videos if user is logged in
        if (isAuthenticated && userVotedVideoIds.length > 0) {
            videoList = videoList.filter(v => !userVotedVideoIds.includes(v.id));
        }

        if (videoList.length > 0) {
            initializeArena(videoList);
            setInitialized(true);
        }
    }, [isLoading, votesLoading, initialized]);

    // Re-initialize only when hashtag filter changes
    useEffect(() => {
        if (!initialized) return; // Don't run on initial load

        let videoList = selectedHashtag ? getVideosByHashtag(selectedHashtag) : getAllVideos();

        if (isAuthenticated && userVotedVideoIds.length > 0) {
            videoList = videoList.filter(v => !userVotedVideoIds.includes(v.id));
        }

        resetArena();
        if (videoList.length > 0) {
            initializeArena(videoList);
        }
    }, [selectedHashtag]);

    const currentVideo = getCurrentVideo();
    const hasNext = currentIndex < arenaVideos.length - 1;
    const hasPrev = currentIndex > 0;

    const allVideos = selectedHashtag
        ? getVideosByHashtag(selectedHashtag)
        : getAllVideos();

    const filteredVideos = isAuthenticated && userVotedVideoIds.length > 0
        ? allVideos.filter(v => !userVotedVideoIds.includes(v.id))
        : allVideos;

    const filteredVideoCount = filteredVideos.length;

    const handleUpvote = () => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        // ArenaCard animation duration is 600ms
        // We wait for the animation to finish before moving to next video
        setTimeout(() => {
            upvote((type, video) => {
                // Call persistent vote action with user ID
                if (profile?.id) {
                    upvoteVideo(video.id, profile.id);
                }

                addArenaPoints(video.id, 10);
                addXP(15);
            });
        }, 600);
    };

    const handleDownvote = () => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        setTimeout(() => {
            downvote((type, video) => {
                // Call persistent vote action with user ID
                if (profile?.id) {
                    downvoteVideo(video.id, profile.id);
                }
                addXP(5);
            });
        }, 600);
    };

    const handleNext = () => {
        nextVideo();
    };

    const handlePrev = () => {
        prevVideo();
    };

    const handleReset = () => {
        const videoList = selectedHashtag
            ? getVideosByHashtag(selectedHashtag)
            : getAllVideos();
        resetArena();
        initializeArena(videoList);
        setInitialized(true); // Ensure re-initialization flag
    };

    const selectHashtag = (hashtagId) => {
        setSelectedHashtag(hashtagId);
        setShowHashtagPicker(false);
        setInitialized(false);
    };

    const clearHashtagFilter = () => {
        setSelectedHashtag(null);
        setInitialized(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="page arena-page">
                <div className="container">
                    <div className="loading-state">
                        <Loader size={32} className="spinner" />
                        <p>Videolar yükleniyor...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="page arena-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="container">
                {/* Header */}
                <header className="arena-header">
                    <div className="arena-title-group">
                        <Swords className="arena-main-icon" size={28} />
                        <h1>Arena</h1>
                    </div>
                    <p className="arena-subtitle">Oyla & Video Sahibine Puan Kazan</p>
                </header>

                {/* Login Warning */}
                {!isAuthenticated && (
                    <motion.div
                        className="auth-warning"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <LogIn size={16} />
                        <span>Oylama için giriş yapmalısın</span>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/login')}>
                            Giriş Yap
                        </button>
                    </motion.div>
                )}

                {/* Hashtag Filter */}
                <div className="hashtag-filter">
                    <button
                        className="filter-btn"
                        onClick={() => setShowHashtagPicker(!showHashtagPicker)}
                    >
                        <Hash size={16} />
                        {selectedTopic ? (
                            <>
                                <span className="filter-emoji">{selectedTopic.emoji}</span>
                                <span>{selectedTopic.tag}</span>
                                <span className="filter-count">({filteredVideoCount})</span>
                            </>
                        ) : (
                            <>
                                <span>Tüm Konular</span>
                                <span className="filter-count">({filteredVideoCount})</span>
                            </>
                        )}
                        <ChevronDown size={16} className={showHashtagPicker ? 'rotated' : ''} />
                    </button>

                    {selectedHashtag && (
                        <button className="clear-filter-btn" onClick={clearHashtagFilter}>
                            Filtreyi Kaldır
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {showHashtagPicker && (
                        <motion.div
                            className="arena-hashtag-picker"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="arena-hashtag-grid">
                                {dailyTopics.map((topic) => {
                                    const count = getVideosByHashtag(topic.id).length;
                                    return (
                                        <button
                                            key={topic.id}
                                            className={`arena-hashtag-option ${selectedHashtag === topic.id ? 'selected' : ''} ${count === 0 ? 'empty' : ''}`}
                                            onClick={() => selectHashtag(topic.id)}
                                        >
                                            <span>{topic.emoji}</span>
                                            <span className="option-tag-name">{topic.tag}</span>
                                            <span className="option-count">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Arena Card or Empty State */}
                <div className="arena-content">
                    {filteredVideoCount === 0 ? (
                        <motion.div
                            className="arena-empty-category"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Video size={64} className="empty-icon" />
                            {selectedHashtag ? (
                                <>
                                    <h3>"{selectedTopic?.tag}" kategorisinde video yok</h3>
                                    <p>Bu kategoride henüz video yüklenmemiş.</p>
                                    <p>İlk videoyu yükleyen sen ol!</p>
                                </>
                            ) : (
                                <>
                                    <h3>Henüz video yok</h3>
                                    <p>Veritabanında video bulunamadı.</p>
                                    <p>Challenge sayfasından ilk videoyu yükle!</p>
                                </>
                            )}
                            {selectedHashtag && (
                                <button className="btn btn-secondary" onClick={clearHashtagFilter}>
                                    Tüm Videolara Bak
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <ArenaCard
                            video={currentVideo}
                            onUpvote={handleUpvote}
                            onDownvote={handleDownvote}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            hasNext={hasNext}
                            hasPrev={hasPrev}
                        />
                    )}
                </div>

                {/* Arena Points Info */}
                {currentVideo && (
                    <motion.div
                        className="arena-points-info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Award size={16} />
                        <span>Beğendiğin videolar +10 arena puanı kazanıyor!</span>
                    </motion.div>
                )}

                {/* Reset Button */}
                {!currentVideo && votesGiven > 0 && arenaVideos.length > 0 && (
                    <motion.div
                        className="arena-reset"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button className="btn btn-primary" onClick={handleReset}>
                            <RotateCcw size={18} />
                            Yeniden Başla
                        </button>
                    </motion.div>
                )}

                {/* XP Progress */}
                <motion.div
                    className="xp-progress-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="xp-header">
                        <span>Kazanılan XP</span>
                        <span className="xp-amount">+{(upvotes * 15) + (downvotes * 5)} XP</span>
                    </div>
                    <div className="progress">
                        <motion.div
                            className="progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(votesGiven * 5, 100)}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Login Prompt Modal */}
            <AnimatePresence>
                {showLoginPrompt && (
                    <motion.div
                        className="login-prompt-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLoginPrompt(false)}
                    >
                        <motion.div
                            className="login-prompt-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LogIn size={48} className="prompt-icon" />
                            <h3>Giriş Gerekli</h3>
                            <p>Oylama yapabilmek için giriş yapmalısın</p>
                            <div className="prompt-actions">
                                <button className="btn btn-secondary" onClick={() => setShowLoginPrompt(false)}>
                                    Vazgeç
                                </button>
                                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                                    Giriş Yap
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default Arena;
