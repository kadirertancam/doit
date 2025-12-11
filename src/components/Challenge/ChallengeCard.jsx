import { motion } from 'framer-motion';
import { Users, Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChallengeTimer from './ChallengeTimer';
import './ChallengeCard.css';

function ChallengeCard({ challenge, variant = 'default' }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/challenge');
    };

    if (variant === 'hero') {
        return (
            <motion.div
                className="challenge-card challenge-card-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onClick={handleClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="challenge-card-glow" />

                <div className="challenge-header">
                    <span className="challenge-badge">
                        {challenge.category.emoji} Günün Challenge'ı
                    </span>
                    <ChallengeTimer endTime={challenge.endTime} />
                </div>

                <div className="challenge-content">
                    <h2 className="challenge-title gradient-text">
                        {challenge.title}
                    </h2>

                    <div className="challenge-category" style={{ '--category-color': challenge.category.color }}>
                        <span className="category-emoji">{challenge.category.emoji}</span>
                        <span className="category-name">{challenge.category.name}</span>
                    </div>
                </div>

                <div className="challenge-footer">
                    <div className="challenge-stats">
                        <Users size={16} />
                        <span>{challenge.participantCount} katılımcı</span>
                    </div>

                    <button className="btn btn-primary challenge-cta">
                        <Play size={18} />
                        <span>Katıl</span>
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="challenge-duration">
                    <span className="duration-value">{challenge.maxDuration}</span>
                    <span className="duration-label">saniye</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="challenge-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="challenge-mini-header">
                <span className="challenge-emoji">{challenge.category.emoji}</span>
                <span className="challenge-mini-title">{challenge.title}</span>
            </div>
            <div className="challenge-mini-stats">
                <Users size={14} />
                <span>{challenge.participantCount}</span>
            </div>
        </motion.div>
    );
}

export default ChallengeCard;
