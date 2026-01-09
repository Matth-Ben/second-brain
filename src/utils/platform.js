import { Capacitor } from '@capacitor/core';

export const isMobile = Capacitor.isNativePlatform();
export const isElectron = !!window.electronAPI;
export const isWeb = !isMobile && !isElectron;
