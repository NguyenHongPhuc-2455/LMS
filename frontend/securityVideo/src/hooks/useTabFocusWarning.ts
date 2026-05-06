import { useEffect, useRef } from 'react';
import { App } from 'antd';

/**
 * Hook phát hiện khi người dùng chuyển Tab hoặc rời khỏi trình duyệt
 * @param title Tiêu đề cảnh báo
 * @param msg Nội dung cảnh báo
 * @param onViolation Callback khi vi phạm (lần 2 trở đi)
 */
export const useTabFocusWarning = (title: string, msg: string, enabled: boolean, onViolation?: (count: number) => void) => {
    const violationCount = useRef(0);
    const { notification } = App.useApp();

    useEffect(() => {
        if (!enabled) return;
        let lastInFocus = true;

        const handleViolation = () => {
            violationCount.current += 1;

            if (violationCount.current === 1) {
                showWarning(title, msg);
            } else {
                showWarning(
                    'Vi phạm nghiêm trọng!',
                    'Bạn đã rời khỏi trang web lần thứ ' + violationCount.current + '. Nội dung bài học sẽ được phát lại từ đầu.'
                );
                if (onViolation) {
                    onViolation(violationCount.current);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                lastInFocus = false;
            } else {
                if (!lastInFocus) {
                    handleViolation();
                    lastInFocus = true;
                }
            }
        };

        const handleBlur = () => {
            lastInFocus = false;
        };

        const handleFocus = () => {
            if (!lastInFocus) {
                handleViolation();
                lastInFocus = true;
            }
        };

        const showWarning = (t: string, m: string) => {
            notification.warning({
                message: t,
                description: m,
                placement: 'topRight',
                duration: 5,
                icon: null,
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [title, msg, onViolation, notification, enabled]);

    return {
        getViolationCount: () => violationCount.current,
        resetViolationCount: () => { violationCount.current = 0; }
    };
};
