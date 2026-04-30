import { Slot, usePathname, router } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabIcons } from '../../constants/icons';
import { useTheme } from '../../hooks/useTheme';
import { TaskModalProvider, useTaskModal } from '../../hooks/useTaskModal';
import { TaskDetailModal } from '../../components/task/TaskDetailModal';

const TABS = [
  { name: 'index', path: '/(tabs)', title: '主页', icon: TabIcons.home },
  { name: 'projects', path: '/(tabs)/projects', title: '项目', icon: TabIcons.projects },
  { name: 'views', path: '/(tabs)/views', title: '视图', icon: TabIcons.views },
  { name: 'settings', path: '/(tabs)/settings', title: '我的', icon: TabIcons.settings },
] as const;

export default function TabsLayout() {
  return (
    <TaskModalProvider>
      <TabsContent />
    </TaskModalProvider>
  );
}

function TabsContent() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state: taskModal, closeTask } = useTaskModal();

  const getIsActive = (tab: typeof TABS[number]) => {
    if (tab.name === 'index') {
      return pathname === '/' || pathname === '/(tabs)';
    }
    return pathname.startsWith(`/${tab.name}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <Slot />
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.background.primary,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        }}
      >
        {TABS.map((tab) => {
          const active = getIsActive(tab);
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                if (active) return;
                router.replace(tab.path as any);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={tab.title}
              accessibilityState={{ selected: active }}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={active ? colors.primary : colors.text.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: active ? colors.primary : colors.text.muted,
                  fontWeight: active ? '600' : '400',
                }}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TaskDetailModal
        visible={taskModal.visible}
        taskUid={taskModal.taskUid}
        projectUid={taskModal.projectUid}
        onClose={closeTask}
      />
    </View>
  );
}
