import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import './ChallengeTimer.css';

function ChallengeTimer({ endTime }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = new Date(endTime);
            const now = new Date();
            const diff = end - now;

            if (diff <= 0) {
                return { hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    const formatNumber = (num) => String(num).padStart(2, '0');

    return (
        <div className="challenge-timer">
            <Clock size={16} className="timer-icon" />
            <div className="timer-blocks">
                <motion.div
                    className="timer-block"
                    key={`h-${timeLeft.hours}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <span className="timer-value">{formatNumber(timeLeft.hours)}</span>
                    <span className="timer-label">saat</span>
                </motion.div>
                <span className="timer-separator">:</span>
                <motion.div
                    className="timer-block"
                    key={`m-${timeLeft.minutes}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <span className="timer-value">{formatNumber(timeLeft.minutes)}</span>
                    <span className="timer-label">dk</span>
                </motion.div>
                <span className="timer-separator">:</span>
                <motion.div
                    className="timer-block"
                    key={`s-${timeLeft.seconds}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <span className="timer-value">{formatNumber(timeLeft.seconds)}</span>
                    <span className="timer-label">sn</span>
                </motion.div>
            </div>
        </div>
    );
}

export default ChallengeTimer;
