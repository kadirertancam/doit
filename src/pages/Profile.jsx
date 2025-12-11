import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Edit2, Settings, LogOut, Award, Flame, Trophy,
    Target, MapPin, Link as LinkIcon, Instagram, Twitter,
    X, Check, ChevronRight, Star, Zap, Medal, Crown, LogIn,
    Plus, Trash2, Play, Video, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useVideoStore } from '../stores/videoStore';
import { supabase } from '../lib/supabase';
import './Profile.css';

// Badge definitions with real conditions
const BADGES = [
    { id: 'first_video', name: 'İlk Adım', emoji: '🎬', desc: 'İlk videoyu yükle', condition: (p) => (p?.total_participations || 0) >= 1 },
    { id: 'ten_videos', name: 'İçerik Üreticisi', emoji: '📹', desc: '10 video yükle', condition: (p) => (p?.total_participations || 0) >= 10 },
    { id: 'first_win', name: 'İlk Zafer', emoji: '🏆', desc: 'İlk challenge kazanımı', condition: (p) => (p?.total_wins || 0) >= 1 },
    { id: 'five_wins', name: 'Şampiyon', emoji: '👑', desc: '5 challenge kazan', condition: (p) => (p?.total_wins || 0) >= 5 },
    { id: 'streak_3', name: 'Tutarlı', emoji: '🔥', desc: '3 günlük seri', condition: (p) => (p?.longest_streak || 0) >= 3 },
    { id: 'streak_7', name: 'Haftalık Seri', emoji: '💪', desc: '7 günlük seri', condition: (p) => (p?.longest_streak || 0) >= 7 },
    { id: 'level_5', name: 'Deneyimli', emoji: '⭐', desc: 'Seviye 5\'e ulaş', condition: (p) => (p?.level || 1) >= 5 },
    { id: 'level_10', name: 'Uzman', emoji: '🌟', desc: 'Seviye 10\'a ulaş', condition: (p) => (p?.level || 1) >= 10 },
    { id: 'arena_100', name: 'Arena Savaşçısı', emoji: '⚔️', desc: '100 arena puanı kazan', condition: (p) => (p?.arena_points || 0) >= 100 },
];

function Profile() {
    const navigate = useNavigate();
    const { profile, isAuthenticated, isLoading, authInitialized, signOut, updateProfile, uploadAvatar } = useAuthStore();
    // Use profile from Supabase
    const currentProfile = profile;

    const { videos, fetchVideos, deleteVideo } = useVideoStore();
    const fileInputRef = useRef(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [playingVideo, setPlayingVideo] = useState(null); // Fix: State for playing video
    const [activeTab, setActiveTab] = useState('videos');
    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        city: '',
        instagram: '',
        twitter: '',
        website: '',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get user's videos
    const userVideos = videos.filter(v => v.userId === currentProfile?.id);

    const xpToNextLevel = 1000;
    const currentXP = currentProfile?.xp || 0;
    const xpProgress = (currentXP % xpToNextLevel) / xpToNextLevel * 100;

    // Calculate badges based on REAL profile data
    const earnedBadges = currentProfile ? BADGES.filter(b => b.condition(currentProfile)) : [];
    const lockedBadges = currentProfile ? BADGES.filter(b => !b.condition(currentProfile)) : BADGES;

    // Fetch videos on mount
    useEffect(() => {
        fetchVideos();
    }, []);

    // Loading state - wait for auth check to complete
    if (!authInitialized || isLoading) {
        return (
            <motion.div
                className="page profile-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="container">
                    <div className="loading-state">
                        <Loader size={32} className="spinner" />
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Not authenticated or no profile - show login prompt
    if (!isAuthenticated || !currentProfile) {
        return (
            <motion.div
                className="page profile-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="container">
                    <div className="login-required">
                        <LogIn size={64} className="login-icon" />
                        <h2>Giriş Gerekli</h2>
                        <p>Profilinizi görüntülemek için giriş yapmalısınız</p>
                        <div className="login-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/login')}>
                                <LogIn size={18} />
                                Giriş Yap
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                                Kayıt Ol
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    const handleEditOpen = () => {
        if (!currentProfile) return;
        setEditForm({
            display_name: currentProfile.display_name || '',
            bio: currentProfile.bio || '',
            city: currentProfile.city || '',
            instagram: currentProfile.instagram || '',
            twitter: currentProfile.twitter || '',
            website: currentProfile.website || '',
        });
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        if (isAuthenticated) {
            await updateProfile(editForm);
        }
        setShowEditModal(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file && isAuthenticated) {
            setIsUploading(true);
            await uploadAvatar(file);
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleDeleteVideo = async (videoId) => {
        setIsDeleting(true);
        const result = await deleteVideo(videoId); // Use store action
        if (result.success) {
            setShowDeleteModal(null);
        } else {
            console.error(result.error);
        }
        setIsDeleting(false);
    };

    // ... (loading and auth checks)

    return (
        <motion.div
            className="page profile-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Floating Add Button - Moved to standard position via CSS, logic unchanged here */}
            <motion.button
                className="fab-button"
                onClick={() => navigate('/challenge')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ top: '20px', right: '20px', bottom: 'auto' }} // Explicit inline style to enforce position
            >
                <Plus size={28} />
            </motion.button>

            <div className="container">
                {/* Profile Header */}
                <motion.div
                    className="profile-header"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            <img
                                src={currentProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentProfile.username}`}
                                alt={currentProfile.display_name}
                                className="profile-avatar"
                            />
                            <button
                                className="avatar-edit-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader size={16} className="spinner" /> : <Camera size={16} />}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="level-badge">
                            <Star size={12} />
                            <span>Lv.{currentProfile.level || 1}</span>
                        </div>
                    </div>

                    <div className="profile-info">
                        <h1 className="display-name">{currentProfile.display_name || 'Kullanıcı'}</h1>
                        <span className="username">@{currentProfile.username || 'user'}</span>

                        {currentProfile.bio && (
                            <p className="bio">{currentProfile.bio}</p>
                        )}

                        <div className="profile-meta">
                            {currentProfile.city && (
                                <span className="meta-item">
                                    <MapPin size={14} />
                                    {currentProfile.city}
                                </span>
                            )}
                        </div>

                        <div className="social-links">
                            {currentProfile.instagram && (
                                <a href={`https://instagram.com/${currentProfile.instagram}`} target="_blank" rel="noopener noreferrer" className="social-link">
                                    <Instagram size={18} />
                                </a>
                            )}
                            {currentProfile.twitter && (
                                <a href={`https://twitter.com/${currentProfile.twitter}`} target="_blank" rel="noopener noreferrer" className="social-link">
                                    <Twitter size={18} />
                                </a>
                            )}
                            {currentProfile.website && (
                                <a href={currentProfile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                                    <LinkIcon size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn" onClick={handleEditOpen}>
                            <Edit2 size={20} />
                        </button>
                        <button className="icon-btn" onClick={() => setShowSettingsModal(true)}>
                            <Settings size={20} />
                        </button>
                    </div>
                </motion.div>

                {/* XP Progress */}
                <motion.div
                    className="xp-card"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="xp-header">
                        <div className="xp-level">
                            <Zap size={20} />
                            <span>Seviye {currentProfile.level || 1}</span>
                        </div>
                        <span className="xp-amount">{currentXP} XP</span>
                    </div>
                    <div className="progress">
                        <motion.div
                            className="progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                        />
                    </div>
                    <span className="xp-next">Sonraki seviye: {xpToNextLevel - (currentXP % xpToNextLevel)} XP</span>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    className="stats-grid"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-card">
                        <Trophy className="stat-icon wins" size={24} />
                        <span className="stat-value">{currentProfile.total_wins || 0}</span>
                        <span className="stat-label">Kazanım</span>
                    </div>
                    <div className="stat-card">
                        <Target className="stat-icon participations" size={24} />
                        <span className="stat-value">{currentProfile.total_participations || 0}</span>
                        <span className="stat-label">Katılım</span>
                    </div>
                    <div className="stat-card">
                        <Flame className="stat-icon streak" size={24} />
                        <span className="stat-value">{currentProfile.current_streak || 0}</span>
                        <span className="stat-label">Seri</span>
                    </div>
                    <div className="stat-card">
                        <Award className="stat-icon arena" size={24} />
                        <span className="stat-value">{currentProfile.arena_points || 0}</span>
                        <span className="stat-label">Arena</span>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    className="profile-tabs"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('videos')}
                    >
                        <Video size={18} />
                        <span>Videolarım ({userVideos.length})</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
                        onClick={() => setActiveTab('badges')}
                    >
                        <Medal size={18} />
                        <span>Rozetler ({earnedBadges.length}/{BADGES.length})</span>
                    </button>
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'videos' ? (
                        <motion.section
                            key="videos"
                            className="my-videos-section"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {userVideos.length === 0 ? (
                                <div className="empty-videos">
                                    <Video size={48} className="empty-icon" />
                                    <h3>Henüz video yok</h3>
                                    <p>İlk challenge'ına katıl ve video yükle!</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/challenge')}>
                                        <Plus size={18} />
                                        İlk Videomu Yükle
                                    </button>
                                </div>
                            ) : (
                                <div className="videos-grid">
                                    {userVideos.map((video, index) => (
                                        <motion.div
                                            key={video.id}
                                            className="video-card"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setPlayingVideo(video)}
                                        >
                                            <img src={video.thumbnailUrl} alt="Video thumbnail" />
                                            <div className="video-overlay">
                                                <div className="video-stats">
                                                    <span><Flame size={14} /> {video.votes}</span>
                                                    <span><Award size={14} /> {video.arenaPoints}</span>
                                                </div>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDeleteModal(video.id);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            {video.videoUrl && (
                                                <div className="play-indicator">
                                                    <Play size={20} />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ) : (
                        <motion.section
                            key="badges"
                            className="badges-section"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {earnedBadges.length > 0 && (
                                <div className="badges-earned">
                                    <h4>Kazanılan</h4>
                                    <div className="badges-grid">
                                        {earnedBadges.map(badge => (
                                            <div key={badge.id} className="badge-card earned">
                                                <span className="badge-emoji">{badge.emoji}</span>
                                                <span className="badge-name">{badge.name}</span>
                                                <span className="badge-desc">{badge.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {lockedBadges.length > 0 && (
                                <div className="badges-locked">
                                    <h4>Kilitli</h4>
                                    <div className="badges-grid">
                                        {lockedBadges.map(badge => (
                                            <div key={badge.id} className="badge-card locked">
                                                <span className="badge-emoji">🔒</span>
                                                <span className="badge-name">{badge.name}</span>
                                                <span className="badge-desc">{badge.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* Quick Menu */}
                <motion.div
                    className="profile-menu"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <button className="menu-item" onClick={() => navigate('/leaderboard')}>
                        <Crown size={20} />
                        <span>Sıralama</span>
                        <ChevronRight size={18} />
                    </button>
                    <button className="menu-item" onClick={handleEditOpen}>
                        <Edit2 size={20} />
                        <span>Profili Düzenle</span>
                        <ChevronRight size={18} />
                    </button>
                    <button className="menu-item" onClick={() => setShowSettingsModal(true)}>
                        <Settings size={20} />
                        <span>Ayarlar</span>
                        <ChevronRight size={18} />
                    </button>
                    <button className="menu-item logout" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Çıkış Yap</span>
                        <ChevronRight size={18} />
                    </button>
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(null)}
                    >
                        <motion.div
                            className="modal-content delete-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 size={48} className="delete-icon" />
                            <h3>Videoyu Sil</h3>
                            <p>Bu video kalıcı olarak silinecek. Emin misin?</p>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteModal(null)}
                                    disabled={isDeleting}
                                >
                                    Vazgeç
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeleteVideo(showDeleteModal)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Siliniyor...' : 'Sil'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Player Modal */}
            <AnimatePresence>
                {playingVideo && (
                    <motion.div
                        className="modal-overlay video-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPlayingVideo(null)}
                    >
                        <motion.div
                            className="video-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="video-modal-close" onClick={() => setPlayingVideo(null)}>
                                <X size={24} />
                            </button>
                            <video
                                src={playingVideo.videoUrl}
                                controls
                                autoPlay
                                className="profile-video-player"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Profili Düzenle</h3>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Görünen İsim</label>
                                    <input
                                        type="text"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                        className="form-input"
                                        placeholder="Görünen isminiz"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Hakkında</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="form-input form-textarea"
                                        placeholder="Kendinizden bahsedin..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><MapPin size={14} /> Şehir</label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="form-input"
                                        placeholder="Şehriniz"
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Instagram size={14} /> Instagram</label>
                                    <input
                                        type="text"
                                        value={editForm.instagram}
                                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                                        className="form-input"
                                        placeholder="instagram_kullanici_adi"
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Twitter size={14} /> Twitter</label>
                                    <input
                                        type="text"
                                        value={editForm.twitter}
                                        onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                                        className="form-input"
                                        placeholder="twitter_kullanici_adi"
                                    />
                                </div>

                                <div className="form-group">
                                    <label><LinkIcon size={14} /> Website</label>
                                    <input
                                        type="url"
                                        value={editForm.website}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                        className="form-input"
                                        placeholder="https://website.com"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    İptal
                                </button>
                                <button className="btn btn-primary" onClick={handleEditSave}>
                                    <Check size={18} />
                                    Kaydet
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettingsModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Ayarlar</h3>
                                <button className="modal-close" onClick={() => setShowSettingsModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="settings-section">
                                    <h4>Bildirimler</h4>
                                    <div className="setting-item">
                                        <span>Push Bildirimleri</span>
                                        <label className="toggle">
                                            <input type="checkbox" defaultChecked />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="setting-item">
                                        <span>E-posta Bildirimleri</span>
                                        <label className="toggle">
                                            <input type="checkbox" />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h4>Gizlilik</h4>
                                    <div className="setting-item">
                                        <span>Profili Herkese Açık</span>
                                        <label className="toggle">
                                            <input type="checkbox" defaultChecked />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h4>Uygulama</h4>
                                    <div className="setting-item">
                                        <span>Versiyon</span>
                                        <span className="setting-value">1.0.0</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setShowSettingsModal(false)}>
                                    Tamam
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default Profile;
