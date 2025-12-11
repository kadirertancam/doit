import { NavLink } from 'react-router-dom';
import { Home, Swords, Hash, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import './BottomNav.css';

const navItems = [
    { path: '/', icon: Home, label: 'Ana Sayfa' },
    { path: '/explore', icon: Hash, label: 'Keşfet' },
    { path: '/arena', icon: Swords, label: 'Arena' },
    { path: '/leaderboard', icon: Trophy, label: 'Sıralama' },
    { path: '/profile', icon: User, label: 'Profil' },
];

function BottomNav() {
    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'nav-item-active' : ''}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        className="nav-indicator"
                                        layoutId="nav-indicator"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                                <item.icon
                                    size={24}
                                    className={`nav-icon ${isActive ? 'nav-icon-active' : ''}`}
                                />
                                <span className="nav-label">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
