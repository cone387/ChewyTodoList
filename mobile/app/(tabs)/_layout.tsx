import { Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabIcons } from '../../constants/icons';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
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
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={TabIcons.home} size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <WebSafeTabButton {...props} to="/(tabs)" />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: '项目',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={TabIcons.projects} size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <WebSafeTabButton {...props} to="/(tabs)/projects" />
          ),
        }}
      />
      <Tabs.Screen
        name="views"
        options={{
          title: '视图',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={TabIcons.views} size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <WebSafeTabButton {...props} to="/(tabs)/views" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '我的',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={TabIcons.settings} size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <WebSafeTabButton {...props} to="/(tabs)/settings" />
          ),
        }}
      />
    </Tabs>
  );
}

/** Web-safe tab button that uses router.replace on web to fix navigation */
function WebSafeTabButton({ children, onPress, to, style, ...rest }: any) {
  if (Platform.OS === 'web') {
    return (
      <Pressable
        onPress={() => router.replace(to)}
        style={typeof style === 'function' ? style : style}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={typeof style === 'function' ? style : style} {...rest}>
      {children}
    </Pressable>
  );
}
