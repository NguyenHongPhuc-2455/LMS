import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { LogIn } from 'lucide-react';
import { message } from 'antd';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            // Lưu thông tin user để Navbar hiển thị nhanh
            localStorage.setItem('user', JSON.stringify(res.data.user));

            message.success('Chào mừng bạn quay trở lại!');

            // Nếu là admin thì vào Dashboard, nếu là học viên thì vào Course List
            if (res.data.user.roles?.includes('admin')) {
                navigate('/');
            } else {
                navigate('/course');
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Sai tài khoản hoặc mật khẩu');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '15px', background: 'var(--primary-gradient)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                        <LogIn size={28} color="white" />
                    </div>
                    <h2 className="premium-title" style={{ fontSize: '28px', margin: 0 }}>ĐĂNG NHẬP</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 8 }}>Hệ thống học tập bảo mật Antigravity</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Tài khoản</label>
                        <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required placeholder="admin" />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>
                        Bắt đầu ngay
                    </button>
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '13px' }}>
                            Chưa có tài khoản? Đăng ký học viên mới
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
