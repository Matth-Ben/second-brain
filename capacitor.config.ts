import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.secondbrain.app',
  appName: 'Second Brain',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
