import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Tạo tài khoản thành công! Mời đăng nhập');
            navigate('/login');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Lỗi đăng ký');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="title">Ghi danh Khoá Học</h2>
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Tên đăng nhập mới</label>
                        <input type="text" className="form-input" onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ Email</label>
                        <input type="email" className="form-input" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu bảo vệ</label>
                        <input type="password" className="form-input" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn-primary">Kích hoạt tài khoản</button>
                    <Link to="/login" className="link-text">Đã có tài khoản? Quay về Đăng nhập</Link>
                </form>
            </div>
        </div>
    );
}
