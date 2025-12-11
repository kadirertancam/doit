import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Flame, Hash, ChevronDown, LogIn, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHashtagStore } from '../stores/hashtagStore';
import { useVideoStore } from '../stores/videoStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { ChallengeTimer } from '../components/Challenge';
import { supabase } from '../lib/supabase';
import './Challenge.css';

function Challenge() {
    const navigate = useNavigate();
    const { getDailyTopics, incrementVideoCount } = useHashtagStore();
    const { addVideo } = useVideoStore();
    const { addParticipation, addXP } = useUserStore();
    const { isAuthenticated, profile } = useAuthStore();

    const [selectedHashtag, setSelectedHashtag] = useState(null);
    const [showHashtagPicker, setShowHashtagPicker] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const dailyTopics = getDailyTopics();
    const selectedTopic = dailyTopics.find(t => t.id === selectedHashtag);

    // Calculate end of day for timer
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Generate thumbnail from video
    const generateThumbnail = useCallback((videoFile) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;

            video.onloadeddata = () => {
                // Seek to 0.5 seconds or 25% of video, whichever is smaller
                video.currentTime = Math.min(0.5, video.duration * 0.25);
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');

                // Calculate aspect ratio to fill canvas
                const videoRatio = video.videoWidth / video.videoHeight;
                const canvasRatio = canvas.width / canvas.height;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (videoRatio > canvasRatio) {
                    drawHeight = canvas.height;
                    drawWidth = video.videoWidth * (canvas.height / video.videoHeight);
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = canvas.width;
                    drawHeight = video.videoHeight * (canvas.width / video.videoWidth);
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                }

                ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

                canvas.toBlob((blob) => {
                    resolve(blob);
                    URL.revokeObjectURL(video.src);
                }, 'image/jpeg', 0.8);
            };

            video.onerror = () => {
                resolve(null);
                URL.revokeObjectURL(video.src);
            };

            video.src = URL.createObjectURL(videoFile);
        });
    }, []);

    const handleFileSelect = async (e) => {
        if (!isAuthenticated) return;

        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);

            // Generate thumbnail
            const thumbnailBlob = await generateThumbnail(file);

            setPreviewVideo({
                url,
                file,
                thumbnailBlob
            });
        }
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !profile?.id) return;
        if (!previewVideo || !selectedHashtag) return;

        setIsUploading(true);

        try {
            const timestamp = Date.now();
            const userId = profile.id;

            // Upload video to Supabase Storage
            const videoExt = previewVideo.file.name.split('.').pop();
            const videoPath = `${userId}/${timestamp}.${videoExt}`;

            const { error: videoUploadError } = await supabase.storage
                .from('videos')
                .upload(videoPath, previewVideo.file);

            if (videoUploadError) {
                console.error('Video upload error:', videoUploadError);
                throw new Error('Video yüklenemedi');
            }

            // Get video URL
            const { data: videoUrlData } = supabase.storage
                .from('videos')
                .getPublicUrl(videoPath);

            // Upload thumbnail if exists
            let thumbnailUrl = `https://picsum.photos/seed/${timestamp}/400/600`;

            if (previewVideo.thumbnailBlob) {
                const thumbPath = `${userId}/${timestamp}_thumb.jpg`;
                const { error: thumbError } = await supabase.storage
                    .from('videos')
                    .upload(thumbPath, previewVideo.thumbnailBlob);

                if (!thumbError) {
                    const { data: thumbUrlData } = supabase.storage
                        .from('videos')
                        .getPublicUrl(thumbPath);
                    thumbnailUrl = thumbUrlData.publicUrl;
                }
            }

            // Add video to database
            const result = await addVideo({
                userId: userId,
                url: videoUrlData.publicUrl,
                thumbnail: thumbnailUrl,
                hashtagId: selectedHashtag
            });

            if (result.success) {
                incrementVideoCount(selectedHashtag);
                addParticipation();
                addXP(100);

                // Clean up
                URL.revokeObjectURL(previewVideo.url);
                setPreviewVideo(null);
                setSelectedHashtag(null);
                setIsSubmitted(true);

                setTimeout(() => setIsSubmitted(false), 3000);
            } else {
                throw new Error(result.error || 'Video kaydedilemedi');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.message || 'Video yüklenemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        if (previewVideo?.url) {
            URL.revokeObjectURL(previewVideo.url);
        }
        setPreviewVideo(null);
    };

    // Not authenticated screen
    if (!isAuthenticated) {
        return (
            <motion.div
                className="page challenge-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="container">
                    <div className="login-required">
                        <LogIn size={64} className="login-icon" />
                        <h2>Giriş Gerekli</h2>
                        <p>Video yüklemek için giriş yapmalısın</p>
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

    return (
        <motion.div
            className="page challenge-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="container">
                {/* Header with Timer */}
                <header className="challenge-header">
                    <h1><Flame size={28} /> Günün Challenge'ı</h1>
                    <ChallengeTimer endTime={endOfDay} />
                </header>

                {/* Success Message */}
                <AnimatePresence>
                    {isSubmitted && (
                        <motion.div
                            className="success-message"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Check size={24} />
                            <span>Video başarıyla yüklendi! +100 XP kazandın 🎉</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hashtag Selection */}
                <motion.div
                    className="hashtag-selection"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <label>Konu Seç</label>
                    <button
                        className="hashtag-picker-btn"
                        onClick={() => setShowHashtagPicker(!showHashtagPicker)}
                    >
                        {selectedTopic ? (
                            <>
                                <span className="selected-emoji">{selectedTopic.emoji}</span>
                                <span className="selected-tag">{selectedTopic.tag}</span>
                            </>
                        ) : (
                            <>
                                <Hash size={18} />
                                <span>Bir konu seç</span>
                            </>
                        )}
                        <ChevronDown size={18} className={showHashtagPicker ? 'rotated' : ''} />
                    </button>

                    <AnimatePresence>
                        {showHashtagPicker && (
                            <motion.div
                                className="hashtag-picker-dropdown"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {dailyTopics.map(topic => (
                                    <button
                                        key={topic.id}
                                        className={`hashtag-option ${selectedHashtag === topic.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedHashtag(topic.id);
                                            setShowHashtagPicker(false);
                                        }}
                                    >
                                        <span className="option-emoji">{topic.emoji}</span>
                                        <span className="option-tag">{topic.tag}</span>
                                        {selectedHashtag === topic.id && <Check size={16} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Video Upload Section */}
                <motion.div
                    className="upload-section"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {previewVideo ? (
                        <div className="video-preview">
                            <video
                                ref={videoRef}
                                src={previewVideo.url}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                            <button className="cancel-btn" onClick={handleCancel}>
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <label className="upload-area">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                                hidden
                            />
                            <div className="upload-content">
                                <Camera size={48} className="upload-icon" />
                                <h3>Video Yükle</h3>
                                <p>6 saniyelik harika içeriğini paylaş</p>
                                <span className="upload-hint">MP4, MOV, WebM</span>
                            </div>
                        </label>
                    )}
                </motion.div>

                {/* Submit Button */}
                <motion.button
                    className="btn btn-primary submit-btn"
                    disabled={!previewVideo || !selectedHashtag || isUploading}
                    onClick={handleSubmit}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {isUploading ? (
                        <>
                            <Loader size={20} className="spinner" />
                            Yükleniyor...
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            Challenge'a Katıl
                        </>
                    )}
                </motion.button>

                {/* Tips */}
                <motion.div
                    className="tips-section"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h4>💡 İpuçları</h4>
                    <ul>
                        <li>6 saniyeyi geçmeyen videolar daha iyi performans gösterir</li>
                        <li>Dikey (9:16) videolar önerilir</li>
                        <li>İyi ışık ve net ses kalitesi şansını artırır</li>
                        <li>Günde bir kez challenge'a katılabilirsin</li>
                    </ul>
                </motion.div>
            </div>
        </motion.div>
    );
}

export default Challenge;
