import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';
import { pendingDeepLink } from '../../hooks/useTaskModal';

/**
 * Deep link route for /task/xxx (push notification, shared link).
 * Sets a pending deep link UID and redirects to tabs home,
 * which picks it up and opens the task modal.
 */
export default function TaskRouteRedirect() {
  const { colors } = useTheme();
  const { uid } = useLocalSearchParams<{ uid: string }>();

  useEffect(() => {
    if (uid) {
      pendingDeepLink.taskUid = uid;
    }
    router.replace('/(tabs)');
  }, [uid]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
