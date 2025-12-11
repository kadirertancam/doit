import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, TrendingUp, Crown, ArrowRight, Hash, Sparkles, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHashtagStore } from '../stores/hashtagStore';
import { useVideoStore } from '../stores/videoStore';
import { useUserStore } from '../stores/userStore';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const { getDailyTopics, getTrendingTopics, selectHashtag, updateVideoCounts } = useHashtagStore();
    const { getTopVideos, fetchVideos, videos, isLoading } = useVideoStore();
    const { user } = useUserStore();

    // Fetch videos on mount
    useEffect(() => {
        fetchVideos();
    }, []);

    // Update hashtag counts when videos change
    useEffect(() => {
        if (videos.length > 0) {
            updateVideoCounts(videos);
        }
    }, [videos, updateVideoCounts]);

    const trendingTopics = getTrendingTopics();
    const topVideos = getTopVideos(5);

    // Simplified animations for mobile performance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } }
    };

    const handleHashtagClick = (hashtagId) => {
        selectHashtag(hashtagId);
        navigate('/explore');
    };

    return (
        <motion.div
            className="page home-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="container">
                {/* Header */}
                <motion.header className="home-header" variants={itemVariants}>
                    <div className="logo-section">
                        <Flame className="logo-icon" size={32} />
                        <h1 className="logo-text">DoIt!</h1>
                    </div>
                    <div className="user-stats">
                        <div className="stat-badge">
                            <TrendingUp size={14} />
                            <span>Seviye {user.level}</span>
                        </div>
                        <div className="stat-badge streak-badge">
                            <Flame size={14} />
                            <span>{user.currentStreak} gün</span>
                        </div>
                    </div>
                </motion.header>

                {/* Trending Hashtags */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <Sparkles size={20} className="section-icon trending-icon" />
                            Trend Konular
                        </h2>
                        <button
                            className="see-all-btn"
                            onClick={() => navigate('/explore')}
                        >
                            Tümü <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="trending-hashtags">
                        {trendingTopics.map((topic, index) => (
                            <motion.button
                                key={topic.id}
                                className="trending-tag-btn"
                                style={{ '--tag-color': topic.color }}
                                onClick={() => handleHashtagClick(topic.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="tag-rank">#{index + 1}</span>
                                <span className="tag-emoji">{topic.emoji}</span>
                                <span className="tag-name">{topic.tag}</span>
                                <span className="tag-count">{topic.videoCount}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.section>

                {/* Top Performers */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <Crown size={20} className="section-icon" />
                            Günün Liderleri
                        </h2>
                        <button
                            className="see-all-btn"
                            onClick={() => navigate('/leaderboard')}
                        >
                            Tümü <ArrowRight size={16} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="loading-inline">
                            <Loader size={20} className="spinner" />
                            <span>Yükleniyor...</span>
                        </div>
                    ) : topVideos.length === 0 ? (
                        <div className="empty-inline">
                            <p>Henüz video yok. İlk videoyu sen yükle!</p>
                        </div>
                    ) : (
                        <div className="top-performers">
                            {topVideos.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    className="performer-card"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="performer-rank">
                                        {index + 1 === 1 && <Crown size={16} className="crown-icon" />}
                                        {index + 1}
                                    </div>
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.displayName}
                                        className="performer-avatar"
                                    />
                                    <div className="performer-info">
                                        <span className="performer-name">@{video.username}</span>
                                        <span className="performer-votes">
                                            <Trophy size={12} />
                                            {video.votes + video.arenaPoints} puan
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Quick Actions */}
                <motion.section className="section quick-actions" variants={itemVariants}>
                    <motion.button
                        className="action-card"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/explore')}
                    >
                        <div className="action-icon explore-icon">
                            <Hash size={24} />
                        </div>
                        <div className="action-content">
                            <h3>Keşfet</h3>
                            <p>Günün 15 Trendi</p>
                        </div>
                        <ArrowRight size={20} className="action-arrow" />
                    </motion.button>

                    <motion.button
                        className="action-card"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/arena')}
                    >
                        <div className="action-icon arena-icon">
                            ⚔️
                        </div>
                        <div className="action-content">
                            <h3>Arena'ya Gir</h3>
                            <p>Oyla ve XP kazan</p>
                        </div>
                        <ArrowRight size={20} className="action-arrow" />
                    </motion.button>

                    <motion.button
                        className="action-card"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/challenge')}
                    >
                        <div className="action-icon challenge-icon">
                            🎬
                        </div>
                        <div className="action-content">
                            <h3>Video Çek</h3>
                            <p>Hashtag seç & paylaş</p>
                        </div>
                        <ArrowRight size={20} className="action-arrow" />
                    </motion.button>
                </motion.section>
            </div>
        </motion.div>
    );
}

export default Home;
