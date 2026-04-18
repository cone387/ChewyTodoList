import { Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabIcons } from '../../constants/icons';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
  // Only use custom tab buttons on web (to fix navigation)
  const webTabButton = Platform.OS === 'web'
    ? (to: string) => (props: any) => {
        const { children, style: _style, ...rest } = props;
        return (
          <Pressable
            onPress={() => router.replace(to as any)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {children}
          </Pressable>
        );
      }
    : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '主页',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name={TabIcons.home} size={24} color={color} />
          ),
          ...(webTabButton ? { tabBarButton: webTabButton('/(tabs)') } : {}),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: '项目',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name={TabIcons.projects} size={24} color={color} />
          ),
          ...(webTabButton ? { tabBarButton: webTabButton('/(tabs)/projects') } : {}),
        }}
      />
      <Tabs.Screen
        name="views"
        options={{
          title: '视图',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name={TabIcons.views} size={24} color={color} />
          ),
          ...(webTabButton ? { tabBarButton: webTabButton('/(tabs)/views') } : {}),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name={TabIcons.settings} size={24} color={color} />
          ),
          ...(webTabButton ? { tabBarButton: webTabButton('/(tabs)/settings') } : {}),
        }}
      />
    </Tabs>
  );
}
