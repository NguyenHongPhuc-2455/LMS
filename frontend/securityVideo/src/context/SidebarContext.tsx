import React, { createContext, useContext, useState, startTransition, type ReactNode } from 'react';

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [collapsed, setCollapsedState] = useState(() => {
        const saved = localStorage.getItem('admin_sidebar_collapsed');
        return saved === 'true';
    });

    const setCollapsed = (val: boolean) => {
        // Yield main thread bằng cách đánh dấu đây là transition không khẩn cấp
        startTransition(() => {
            setCollapsedState(val);
        });
        
        // Lưu vào localStorage sau khi UI đã phản hồi để tránh block main thread
        setTimeout(() => {
            localStorage.setItem('admin_sidebar_collapsed', String(val));
        }, 0);
    };

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
