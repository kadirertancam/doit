import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home, Arena, Challenge, Explore, Leaderboard, Profile, Login, Register } from './pages';
import { useAuthStore } from './stores/authStore';
import './index.css';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main App Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="arena" element={<Arena />} />
          <Route path="challenge" element={<Challenge />} />
          <Route path="explore" element={<Explore />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
