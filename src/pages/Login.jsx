import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Flame, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const { signIn, isLoading, error } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('Lütfen tüm alanları doldurun');
            return;
        }

        const result = await signIn(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setLocalError(result.error || 'Giriş başarısız');
        }
    };

    return (
        <motion.div
            className="auth-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="auth-container">
                {/* Logo */}
                <motion.div
                    className="auth-logo"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Flame size={48} className="logo-icon" />
                    <h1 className="logo-text">DoIt!</h1>
                    <p className="logo-subtitle">Challenge & Kazan</p>
                </motion.div>

                {/* Login Form */}
                <motion.form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Giriş Yap</h2>

                    {(localError || error) && (
                        <div className="auth-error">
                            {localError || error}
                        </div>
                    )}

                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Şifreniz"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        <ArrowRight size={18} />
                    </button>

                    <div className="auth-link">
                        Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
                    </div>
                </motion.form>
            </div>
        </motion.div>
    );
}

export default Login;
