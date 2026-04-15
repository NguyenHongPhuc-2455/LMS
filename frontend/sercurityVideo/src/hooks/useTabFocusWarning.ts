import { useEffect, useRef } from 'react';
import { notification } from 'antd';

/**
 * Hook phát hiện khi người dùng chuyển Tab hoặc rời khỏi trình duyệt
 * @param title Tiêu đề cảnh báo
 * @param message Nội dung cảnh báo
 * @param onViolation Callback khi vi phạm (lần 2 trở đi)
 */
export const useTabFocusWarning = (title: string, message: string, onViolation?: (count: number) => void) => {
    const violationCount = useRef(0);

    useEffect(() => {
        let lastInFocus = true;

        const handleViolation = () => {
            violationCount.current += 1;

            if (violationCount.current === 1) {
                // Lần 1: Chỉ cảnh báo
                showWarning(title, message);
            } else {
                // Lần 2 trở đi: Cảnh báo + Reset video (qua callback)
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
    }, [title, message, onViolation]);

    // Trả về hàm reset nếu cần từ bên ngoài (tùy chọn)
    return {
        getViolationCount: () => violationCount.current,
        resetViolationCount: () => { violationCount.current = 0; }
    };
};
