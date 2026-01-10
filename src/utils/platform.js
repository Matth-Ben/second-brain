import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

// For native mobile apps
export const isNativeMobile = Capacitor.isNativePlatform();
export const isElectron = !!window.electronAPI;
export const isWeb = !isNativeMobile && !isElectron;

// Static check for SSR compatibility
export const isMobile = isNativeMobile || (typeof window !== 'undefined' && window.innerWidth < 768);

// Hook for responsive mobile detection
export function useIsMobile() {
    const [isMobileView, setIsMobileView] = useState(() => {
        if (isNativeMobile) return true;
        if (typeof window === 'undefined') return false;
        return window.innerWidth < 768;
    });

    useEffect(() => {
        if (isNativeMobile) return; // Native mobile is always mobile

        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobileView;
}
