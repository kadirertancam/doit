import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Swords, Hash, Trophy, User } from 'lucide-react';
import './BottomNav.css';

const navItems = [
    { path: '/', icon: Home, label: 'Ana Sayfa' },
    { path: '/explore', icon: Hash, label: 'Keşfet' },
    { path: '/arena', icon: Swords, label: 'Arena' },
    { path: '/leaderboard', icon: Trophy, label: 'Sıralama' },
    { path: '/profile', icon: User, label: 'Profil' },
];

// Memoized nav item to prevent re-renders
const NavItem = memo(function NavItem({ path, Icon, label }) {
    return (
        <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && <div className="nav-indicator" />}
                    <Icon
                        size={24}
                        className={`nav-icon ${isActive ? 'nav-icon-active' : ''}`}
                    />
                    <span className="nav-label">{label}</span>
                </>
            )}
        </NavLink>
    );
});

function BottomNav() {
    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        path={item.path}
                        Icon={item.icon}
                        label={item.label}
                    />
                ))}
            </div>
        </nav>
    );
}

export default memo(BottomNav);
