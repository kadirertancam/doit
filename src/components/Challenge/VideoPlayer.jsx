import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import './VideoPlayer.css';

function VideoPlayer({
    src,
    thumbnail,
    autoPlay = false,
    loop = true,
    muted = true,
    showControls = true,
    onEnd,
    maxDuration = 6
}) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(muted);
    const [progress, setProgress] = useState(0);
    const [showOverlay, setShowOverlay] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const currentProgress = (video.currentTime / maxDuration) * 100;
            setProgress(Math.min(currentProgress, 100));
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setShowOverlay(true);
            if (onEnd) onEnd();
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
        };
    }, [maxDuration, onEnd]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
            setShowOverlay(false);
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const restart = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        video.currentTime = 0;
        video.play();
        setIsPlaying(true);
        setShowOverlay(false);
    };

    return (
        <div className="video-player" onClick={togglePlay}>
            {/* Thumbnail or Video */}
            {thumbnail && !src ? (
                <img src={thumbnail} alt="Video thumbnail" className="video-thumbnail" />
            ) : (
                <video
                    ref={videoRef}
                    src={src}
                    poster={thumbnail}
                    loop={loop}
                    muted={isMuted}
                    playsInline
                    className="video-element"
                />
            )}

            {/* Overlay */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        className="video-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.button
                            className="play-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Play size={32} fill="white" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            {showControls && (
                <div className="video-controls">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="controls-row">
                        <button
                            className="control-btn"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>

                        <button
                            className="control-btn"
                            onClick={restart}
                        >
                            <RotateCcw size={18} />
                        </button>

                        <button
                            className="control-btn"
                            onClick={toggleMute}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Duration Badge */}
            <div className="duration-badge">
                {maxDuration}s
            </div>
        </div>
    );
}

export default VideoPlayer;
