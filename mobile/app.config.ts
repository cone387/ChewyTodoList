import 'dotenv/config';
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ChewyTodo',
  slug: 'chewytodo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'chewytodo',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    imageWidth: 120,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.chewytodo.app',
    buildNumber: '1',
    associatedDomains: [],
    infoPlist: {
      NSUserNotificationsUsageDescription:
        'ChewyTodo 需要通知权限来发送任务提醒，确保您不会错过重要事项。',
      UIBackgroundModes: ['remote-notification'],
    },
    entitlements: {
      'aps-environment': 'production',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
      NSPrivacyTracking: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    package: 'com.chewytodo.app',
    versionCode: 1,
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'SCHEDULE_EXACT_ALARM'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  updates: {
    url: 'https://u.expo.dev/your-project-id',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#8b5cf6',
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8400/api',
    eas: {
      projectId: '',
    },
  },
  owner: '',
});
