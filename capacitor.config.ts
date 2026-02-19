import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourcompany.mastergym',
  appName: 'Master Fit',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
}

export default config
