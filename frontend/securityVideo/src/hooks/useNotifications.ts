import { useState, useEffect } from 'react';
import { notificationService } from '../services/notification.service';
import { socketService } from '../services/socket';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const useNotifications = (userId: number | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await notificationService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications();

            const socket = socketService.connect(userId);

            socket.on('newNotification', (newNotif: Notification) => {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            return () => {
                socket.off('newNotification');
                socketService.disconnect();
            };
        }
    }, [userId]);

    const markAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await notificationService.delete(id);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            await notificationService.deleteAll();
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    };
};
