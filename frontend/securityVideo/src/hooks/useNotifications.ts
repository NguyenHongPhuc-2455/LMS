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
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchNotifications = async (initialPage = 1) => {
        if (!userId) return;
        try {
            if (initialPage === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const limit = 10;
            const data = await notificationService.getAll(initialPage, limit);
            const { notifications: newNotifs, unreadCount: count } = data;

            if (initialPage === 1) {
                setNotifications(newNotifs);
                setPage(1);
            } else {
                setNotifications(prev => [...prev, ...newNotifs]);
                setPage(initialPage);
            }

            setUnreadCount(count);
            setHasMore(newNotifs.length === limit);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications(1);

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

    const loadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            fetchNotifications(page + 1);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            // Cập nhật local state để mượt mà hơn
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await notificationService.delete(id);
            const deletedNotif = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (deletedNotif && !deletedNotif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            await notificationService.deleteAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    };
};
