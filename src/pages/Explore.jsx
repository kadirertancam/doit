import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Hash, TrendingUp, Search, Grid, X, ThumbsUp, ThumbsDown,
    MessageCircle, Send, ChevronLeft, Flame, Award, Loader, LogIn, Sparkles, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHashtagStore } from '../stores/hashtagStore';
import { useVideoStore } from '../stores/videoStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import './Explore.css';

function Explore() {
    const navigate = useNavigate();
    const { getDailyTopics, getTrendingTopics, selectedHashtag, selectHashtag, clearSelection, getTopicById, updateVideoCounts, isAIGenerated, isLoading: hashtagLoading, regenerateWithAI } = useHashtagStore();
    const { getVideosByHashtag, upvoteVideo, downvoteVideo, addComment, getVideoById, fetchVideos, videos, isLoading, fetchUserVotes, userVotedVideoIds } = useVideoStore();
    const { addXP } = useUserStore();
    const { isAuthenticated, profile } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

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

    // Update hashtag counts when videos change
    useEffect(() => {
        if (videos.length > 0) {
            updateVideoCounts(videos);
        }
    }, [videos, updateVideoCounts]);

    const dailyTopics = getDailyTopics();
    const trendingTopics = getTrendingTopics();

    const filteredTopics = searchQuery
        ? dailyTopics.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : dailyTopics;

    const selectedTopicData = selectedHashtag ? getTopicById(selectedHashtag) : null;
    const hashtagVideos = selectedHashtag ? getVideosByHashtag(selectedHashtag) : [];

    const handleVote = (videoId, type) => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        if (type === 'up') {
            upvoteVideo(videoId, profile?.id);
            addXP(5);
        } else {
            downvoteVideo(videoId, profile?.id);
        }
    };

    const handleAddComment = (videoId) => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        if (commentText.trim() && profile) {
            addComment(videoId, commentText.trim(), profile.id, profile.username);
            setCommentText('');
            addXP(2);
        }
    };

    const openVideoDetail = (video) => {
        setSelectedVideo(video);
    };

    const closeVideoDetail = () => {
        setSelectedVideo(null);
        setCommentText('');
    };

    // Video detail modal
    const renderVideoDetail = () => {
        if (!selectedVideo) return null;

        const video = getVideoById(selectedVideo.id) || selectedVideo;

        return (
            <motion.div
                className="video-detail-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeVideoDetail}
            >
                <motion.div
                    className="video-detail-modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={closeVideoDetail}>
                        <X size={24} />
                    </button>

                    <div className="video-detail-content">
                        <div className="video-detail-media">
                            <img src={video.thumbnailUrl} alt={video.displayName} />
                        </div>

                        <div className="video-detail-info">
                            <div className="video-detail-header">
                                <div className="video-author">
                                    <span className="author-name">@{video.username}</span>
                                    <span className="video-time">
                                        {new Date(video.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            </div>

                            <div className="video-stats">
                                <div className="stat-item">
                                    <Flame size={18} />
                                    <span>{video.votes} oy</span>
                                </div>
                                <div className="stat-item">
                                    <Award size={18} />
                                    <span>{video.arenaPoints} arena puanı</span>
                                </div>
                            </div>

                            <div className="video-actions">
                                <button
                                    className={`action-btn upvote-btn ${!isAuthenticated || userVotedVideoIds.includes(video.id) ? 'disabled' : ''}`}
                                    onClick={() => !userVotedVideoIds.includes(video.id) && handleVote(video.id, 'up')}
                                    disabled={userVotedVideoIds.includes(video.id)}
                                >
                                    <ThumbsUp size={20} />
                                    {userVotedVideoIds.includes(video.id) ? 'Beğendin' : 'Beğen'}
                                </button>
                                <button
                                    className={`action-btn downvote-btn ${!isAuthenticated || userVotedVideoIds.includes(video.id) ? 'disabled' : ''}`}
                                    onClick={() => !userVotedVideoIds.includes(video.id) && handleVote(video.id, 'down')}
                                    disabled={userVotedVideoIds.includes(video.id)}
                                >
                                    <ThumbsDown size={20} />
                                    Beğenme
                                </button>
                            </div>

                            {!isAuthenticated && (
                                <div className="auth-note">
                                    <LogIn size={14} />
                                    <span>Beğenmek için <a onClick={() => navigate('/login')}>giriş yap</a></span>
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="comments-section">
                                <h4><MessageCircle size={16} /> Yorumlar ({video.comments?.length || 0})</h4>

                                <div className="comments-list">
                                    {(!video.comments || video.comments.length === 0) ? (
                                        <p className="no-comments">Henüz yorum yok. İlk yorumu sen yaz!</p>
                                    ) : (
                                        video.comments.map(comment => (
                                            <div key={comment.id} className="comment-item">
                                                <span className="comment-author">@{comment.username}</span>
                                                <p className="comment-text">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {isAuthenticated ? (
                                    <div className="comment-input-wrapper">
                                        <input
                                            type="text"
                                            className="comment-input"
                                            placeholder="Yorum yaz..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(video.id)}
                                        />
                                        <button
                                            className="send-comment-btn"
                                            onClick={() => handleAddComment(video.id)}
                                            disabled={!commentText.trim()}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="comment-login-prompt">
                                        <LogIn size={16} />
                                        <span>Yorum yapmak için <a onClick={() => navigate('/login')}>giriş yap</a></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    if (isLoading) {
        return (
            <div className="page explore-page">
                <div className="container">
                    <div className="loading-state">
                        <Loader size={32} className="spinner" />
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="page explore-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="container">
                {/* Header */}
                <header className="explore-header">
                    <div className="explore-title-row">
                        <h1><Hash size={28} /> Keşfet</h1>
                        {isAIGenerated && (
                            <span className="ai-badge">
                                <Sparkles size={14} />
                                AI
                            </span>
                        )}
                    </div>
                    <p className="explore-subtitle">
                        Günün 15 Trend Konusu
                        {isAIGenerated && <span className="ai-note"> • AI tarafından belirlendi</span>}
                    </p>
                    {hashtagLoading && (
                        <div className="header-loading">
                            <Loader size={16} className="spinner" />
                            <span>Konular yükleniyor...</span>
                        </div>
                    )}
                </header>

                {/* Search */}
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Konu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Selected Hashtag View */}
                {selectedHashtag && selectedTopicData ? (
                    <motion.div
                        className="hashtag-detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="hashtag-detail-header">
                            <button className="back-btn" onClick={clearSelection}>
                                <ChevronLeft size={24} />
                            </button>
                            <div className="hashtag-info">
                                <span className="hashtag-emoji">{selectedTopicData.emoji}</span>
                                <div>
                                    <h2>{selectedTopicData.tag}</h2>
                                    <span className="video-count">{hashtagVideos.length} video</span>
                                </div>
                            </div>
                        </div>

                        {/* Video Grid */}
                        <div className="video-grid">
                            {hashtagVideos.length === 0 ? (
                                <div className="empty-grid">
                                    <Hash size={48} className="empty-icon" />
                                    <p>Bu konuda henüz video yok.</p>
                                    <p>İlk videoyu sen yükle!</p>
                                </div>
                            ) : (
                                hashtagVideos.map((video) => (
                                    <motion.div
                                        key={video.id}
                                        className="video-card"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={() => openVideoDetail(video)}
                                    >
                                        <img src={video.thumbnailUrl} alt={video.displayName} />
                                        <div className="video-card-overlay">
                                            <div className="video-card-stats">
                                                <span><ThumbsUp size={12} /> {video.votes}</span>
                                                <span><MessageCircle size={12} /> {video.comments?.length || 0}</span>
                                            </div>
                                            <span className="video-card-author">@{video.username}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Trending Section */}
                        <section className="trending-section">
                            <h3><TrendingUp size={18} /> Trend Konular</h3>
                            <div className="trending-list">
                                {trendingTopics.map((topic, index) => (
                                    <motion.button
                                        key={topic.id}
                                        className="trending-item"
                                        style={{ '--accent': topic.color }}
                                        onClick={() => selectHashtag(topic.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="trending-rank">#{index + 1}</span>
                                        <span className="trending-emoji">{topic.emoji}</span>
                                        <div className="trending-info">
                                            <span className="trending-tag">{topic.tag}</span>
                                            <span className="trending-count">{topic.videoCount} video</span>
                                        </div>
                                        <Flame size={18} className="trending-fire" />
                                    </motion.button>
                                ))}
                            </div>
                        </section>

                        {/* All Topics Grid */}
                        <section className="topics-section">
                            <h3><Grid size={18} /> Tüm Konular</h3>
                            <div className="topics-grid">
                                {filteredTopics.map((topic) => (
                                    <motion.button
                                        key={topic.id}
                                        className="topic-card"
                                        style={{ '--card-color': topic.color }}
                                        onClick={() => selectHashtag(topic.id)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.15 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <span className="topic-emoji">{topic.emoji}</span>
                                        <span className="topic-tag">{topic.tag}</span>
                                        <span className="topic-count">{topic.videoCount}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>

            {/* Video Detail Modal */}
            <AnimatePresence>
                {selectedVideo && renderVideoDetail()}
            </AnimatePresence>

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
                            <p>Bu işlem için giriş yapmalısın</p>
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

export default Explore;
