import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Flame, Award, TrendingUp, Hash } from 'lucide-react';
import { useVideoStore } from '../stores/videoStore';
import { useHashtagStore } from '../stores/hashtagStore';
import './Leaderboard.css';

function Leaderboard() {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedHashtag, setSelectedHashtag] = useState(null);

    const { videos, fetchVideos, getTopVideos } = useVideoStore();
    const { getDailyTopics, getTopicById } = useHashtagStore();

    useEffect(() => {
        fetchVideos();
    }, []);

    const dailyTopics = getDailyTopics();
    const topVideos = getTopVideos(20, selectedHashtag);
    const selectedTopic = selectedHashtag ? getTopicById(selectedHashtag) : null;

    // Get top 3 for podium ONLY if we have enough videos
    const showPodium = topVideos.length >= 3;
    const podium = showPodium ? topVideos.slice(0, 3) : [];
    const rest = showPodium ? topVideos.slice(3) : topVideos;

    const tabs = [
        { id: 'daily', label: 'Günlük' },
        { id: 'weekly', label: 'Haftalık' },
        { id: 'alltime', label: 'Tüm Zamanlar' },
    ];

    return (
        <motion.div
            className="page leaderboard-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="container">
                {/* Header */}
                <header className="leaderboard-header">
                    <div className="header-title">
                        <Trophy size={28} className="trophy-icon" />
                        <h1>Sıralama</h1>
                    </div>
                    <p className="header-subtitle">En iyi içerik üreticileri</p>
                </header>

                {/* Tabs */}
                <div className="tab-container">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Hashtag Filter */}
                <div className="hashtag-filter-scroll">
                    <button
                        className={`filter-chip ${!selectedHashtag ? 'active' : ''}`}
                        onClick={() => setSelectedHashtag(null)}
                    >
                        Tümü
                    </button>
                    {dailyTopics.slice(0, 8).map((topic) => (
                        <button
                            key={topic.id}
                            className={`filter-chip ${selectedHashtag === topic.id ? 'active' : ''}`}
                            onClick={() => setSelectedHashtag(topic.id)}
                        >
                            {topic.emoji} {topic.tag}
                        </button>
                    ))}
                </div>

                {selectedTopic && (
                    <div className="selected-filter-info">
                        <Hash size={16} />
                        <span>{selectedTopic.tag}</span>
                    </div>
                )}

                {/* Podium */}
                {showPodium && (
                    <motion.div
                        className="podium"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* 2nd Place */}
                        <div className="podium-item second">
                            <div className="podium-avatar-wrapper">
                                <img
                                    src={podium[1].thumbnailUrl}
                                    alt={podium[1].username}
                                    className="podium-avatar"
                                />
                                <span className="podium-badge silver">2</span>
                            </div>
                            <span className="podium-name">@{podium[1].username}</span>
                            <span className="podium-score">{podium[1].votes + podium[1].arenaPoints}</span>
                        </div>

                        {/* 1st Place */}
                        <div className="podium-item first">
                            <Crown size={24} className="crown" />
                            <div className="podium-avatar-wrapper">
                                <img
                                    src={podium[0].thumbnailUrl}
                                    alt={podium[0].username}
                                    className="podium-avatar"
                                />
                                <span className="podium-badge gold">1</span>
                            </div>
                            <span className="podium-name">@{podium[0].username}</span>
                            <span className="podium-score">{podium[0].votes + podium[0].arenaPoints}</span>
                        </div>

                        {/* 3rd Place */}
                        <div className="podium-item third">
                            <div className="podium-avatar-wrapper">
                                <img
                                    src={podium[2].thumbnailUrl}
                                    alt={podium[2].username}
                                    className="podium-avatar"
                                />
                                <span className="podium-badge bronze">3</span>
                            </div>
                            <span className="podium-name">@{podium[2].username}</span>
                            <span className="podium-score">{podium[2].votes + podium[2].arenaPoints}</span>
                        </div>
                    </motion.div>
                )}

                {/* Rest of Rankings */}
                <motion.div
                    className="rankings-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {rest.map((video, index) => (
                        <motion.div
                            key={video.id}
                            className="ranking-item"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.05 * index }}
                        >
                            <span className="ranking-position">{showPodium ? index + 4 : index + 1}</span>
                            <img
                                src={video.thumbnailUrl}
                                alt={video.username}
                                className="ranking-avatar"
                            />
                            <div className="ranking-info">
                                <span className="ranking-name">@{video.username}</span>
                                <div className="ranking-stats">
                                    <span><Trophy size={12} /> {video.votes} oy</span>
                                    <span><Award size={12} /> {video.arenaPoints} arena</span>
                                </div>
                            </div>
                            <div className="ranking-score">
                                <TrendingUp size={14} />
                                <span className="score-value">{video.votes + video.arenaPoints}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {topVideos.length === 0 && (
                    <div className="empty-state">
                        <Trophy size={48} className="empty-icon" />
                        <h3>Henüz sıralama yok</h3>
                        <p>Bu kategoride video bekleniyor</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default Leaderboard;
