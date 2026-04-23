import React, { useState, useEffect } from 'react';
import { Row, Col, App, Form } from 'antd';
import { userService } from '../../../services/user.service';
import dayjs from 'dayjs';
import styles from './Profile.module.scss';

// Sub-components
import ProfileHeader from './components/ProfileHeader';
import ProfileEditModal from './components/ProfileEditModal';
import ProfileSections from './components/ProfileSections';
import { LearningStatsChart } from '../../../components';

const Profile: React.FC = () => {
    const { message } = App.useApp();
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchUser = async () => {
        try {
            const data = await userService.getProfile();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            const userStr = localStorage.getItem('user');
            if (userStr) setUser(JSON.parse(userStr));
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const setFormFields = () => {
        if (!user) return;
        form.setFieldsValue({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            dob: user.dob ? dayjs(user.dob) : null,
            avatar: user.avatar
        });
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                dob: values.dob ? values.dob.toISOString() : null
            };
            const data = await userService.updateProfile(payload);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            message.success('Cập nhật hồ sơ thành công!');
            setIsModalOpen(false);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className={styles.profileContainer}>
            <Row gutter={24}>
                <Col xs={24} md={8}>
                    <ProfileHeader
                        user={user}
                        setIsModalOpen={setIsModalOpen}
                        handleLogout={handleLogout}
                        setFormFields={setFormFields}
                    />
                </Col>
                <Col xs={24} md={16}>
                    <LearningStatsChart />
                    <ProfileSections />
                </Col>
            </Row>

            <ProfileEditModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                onFinish={onFinish}
                loading={loading}
                form={form}
            />
        </div>
    );
};

export default Profile;

