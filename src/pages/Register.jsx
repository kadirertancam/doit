import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, Flame, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const { signUp, isLoading, error } = useAuthStore();

    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        const { username, displayName, email, password, confirmPassword } = formData;

        if (!username || !displayName || !email || !password) {
            setLocalError('Lütfen tüm alanları doldurun');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Şifreler eşleşmiyor');
            return;
        }

        if (password.length < 6) {
            setLocalError('Şifre en az 6 karakter olmalı');
            return;
        }

        if (username.length < 3) {
            setLocalError('Kullanıcı adı en az 3 karakter olmalı');
            return;
        }

        const result = await signUp(email, password, username, displayName);
        if (result.success) {
            navigate('/');
        } else {
            setLocalError(result.error || 'Kayıt başarısız');
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
                    <p className="logo-subtitle">Topluluğa Katıl</p>
                </motion.div>

                {/* Register Form */}
                <motion.form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Kayıt Ol</h2>

                    {(localError || error) && (
                        <div className="auth-error">
                            {localError || error}
                        </div>
                    )}

                    <div className="input-group">
                        <AtSign size={18} className="input-icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Kullanıcı adı"
                            value={formData.username}
                            onChange={handleChange}
                            className="auth-input"
                        />
                    </div>

                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="text"
                            name="displayName"
                            placeholder="Görünen isim"
                            value={formData.displayName}
                            onChange={handleChange}
                            className="auth-input"
                        />
                    </div>

                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="E-posta adresiniz"
                            value={formData.email}
                            onChange={handleChange}
                            className="auth-input"
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Şifre (min 6 karakter)"
                            value={formData.password}
                            onChange={handleChange}
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

                    <div className="input-group">
                        <Check size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Şifre tekrar"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="auth-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        <ArrowRight size={18} />
                    </button>

                    <div className="auth-link">
                        Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
                    </div>
                </motion.form>
            </div>
        </motion.div>
    );
}

export default Register;
