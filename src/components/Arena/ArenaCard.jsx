import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import './ArenaCard.css';

function ArenaCard({ video, onUpvote, onDownvote, onNext, onPrev, hasNext, hasPrev }) {
    const [voteAnimation, setVoteAnimation] = useState(null); // 'up' | 'down' | null
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);

    // Motion values for drag
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Transform for visual feedback
    const upOpacity = useTransform(y, [-100, 0], [1, 0]);
    const downOpacity = useTransform(y, [0, 100], [0, 1]);
    // Sola kaydırırken (negatif x) = önceki göster
    const prevOpacity = useTransform(x, [-100, 0], [1, 0]);
    // Sağa kaydırırken (pozitif x) = sonraki göster
    const nextOpacity = useTransform(x, [0, 100], [0, 1]);

    // Card rotation based on drag
    const rotateZ = useTransform(x, [-200, 200], [-15, 15]);
    const scale = useTransform(
        [x, y],
        ([latestX, latestY]) => {
            const distance = Math.sqrt(latestX * latestX + latestY * latestY);
            return 1 - Math.min(distance / 1000, 0.1);
        }
    );

    // Reset video when video changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
        }
    }, [video]);

    if (!video) {
        return (
            <div className="arena-empty">
                <ThumbsUp size={48} className="empty-icon" />
                <h3>Tüm videoları izledin!</h3>
                <p>Daha fazla video için geri gel</p>
            </div>
        );
    }

    const hasVideo = video.videoUrl && video.videoUrl.startsWith('http');

    const handleDragEnd = (_, info) => {
        const { offset, velocity } = info;
        const swipeThreshold = 80;
        const velocityThreshold = 300;

        // Determine dominant direction
        const absX = Math.abs(offset.x);
        const absY = Math.abs(offset.y);

        if (absY > absX && absY > swipeThreshold) {
            // Vertical swipe - vote
            if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
                // Swipe up - upvote
                triggerVote('up');
            } else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
                // Swipe down - downvote
                triggerVote('down');
            }
        } else if (absX > absY && absX > swipeThreshold) {
            // Horizontal swipe - navigate
            if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
                // Sağdan sola kaydır (negatif x) = önceki video
                if (hasPrev) onPrev();
            } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
                // Soldan sağa kaydır (pozitif x) = sonraki video
                if (hasNext) onNext();
            }
        }
    };

    const triggerVote = (type) => {
        setVoteAnimation(type);

        setTimeout(() => {
            if (type === 'up') {
                onUpvote();
            } else {
                onDownvote();
            }
            setVoteAnimation(null);
        }, 600);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    return (
        <div className="arena-card-wrapper">
            {/* Vote Indicators */}
            <motion.div
                className="vote-indicator upvote-indicator"
                style={{ opacity: upOpacity }}
            >
                <ThumbsUp size={40} />
                <span>Beğendim</span>
            </motion.div>

            <motion.div
                className="vote-indicator downvote-indicator"
                style={{ opacity: downOpacity }}
            >
                <ThumbsDown size={40} />
                <span>Beğenmedim</span>
            </motion.div>

            {/* Navigation Indicators */}
            <motion.div
                className="nav-indicator prev-indicator"
                style={{ opacity: prevOpacity }}
            >
                <ChevronLeft size={32} />
                <span>Önceki</span>
            </motion.div>

            <motion.div
                className="nav-indicator next-indicator"
                style={{ opacity: nextOpacity }}
            >
                <ChevronRight size={32} />
                <span>Sonraki</span>
            </motion.div>

            {/* Main Card */}
            <motion.div
                className="arena-video-card"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                style={{ x, y, rotateZ, scale }}
                whileTap={{ cursor: 'grabbing' }}
            >
                {hasVideo ? (
                    <>
                        <video
                            ref={videoRef}
                            src={video.videoUrl}
                            className="arena-video-player"
                            poster={video.thumbnailUrl}
                            loop
                            muted={isMuted}
                            playsInline
                            autoPlay
                            draggable={false}
                        />
                        <button className="mute-btn" onClick={toggleMute} onPointerDown={(e) => e.stopPropagation()}>
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </>
                ) : (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.displayName}
                        className="arena-video-thumbnail"
                        draggable={false}
                    />
                )}

                {/* User Info Overlay */}
                <div className="arena-video-overlay">
                    <div className="video-user-info">
                        <span className="video-username">@{video.username}</span>
                        <span className="video-votes">{video.votes} oy</span>
                    </div>
                </div>

                {/* Swipe Instructions */}
                <div className="swipe-instructions">
                    <div className="instruction">
                        <ThumbsUp size={14} /> Yukarı kaydır
                    </div>
                    <div className="instruction">
                        <ThumbsDown size={14} /> Aşağı kaydır
                    </div>
                </div>
            </motion.div>

            {/* Vote Animation Overlay */}
            <AnimatePresence>
                {voteAnimation && (
                    <motion.div
                        className={`vote-animation ${voteAnimation === 'up' ? 'vote-up' : 'vote-down'}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        <motion.div
                            className="vote-thumb"
                            animate={{
                                scale: [1, 1.3, 1],
                                rotate: voteAnimation === 'up' ? [0, -10, 10, 0] : [0, 10, -10, 0]
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            {voteAnimation === 'up' ? (
                                <ThumbsUp size={80} />
                            ) : (
                                <ThumbsDown size={80} />
                            )}
                        </motion.div>
                        <motion.span
                            className="vote-text"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {voteAnimation === 'up' ? 'Beğendin!' : 'Beğenmedin!'}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ArenaCard;
