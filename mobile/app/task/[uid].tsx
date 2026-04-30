import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

/**
 * Fallback route for deep linking (e.g. /task/xxx).
 * Redirects to the tabs home page which will use the context-based modal.
 * The task modal is rendered via TaskModalProvider in (tabs)/_layout.
 */
export default function TaskRouteRedirect() {
  const { colors } = useTheme();
  const { uid } = useLocalSearchParams<{ uid: string }>();

  useEffect(() => {
    // Replace with tabs home — the deep link task opening
    // will be handled via URL params in the future if needed
    router.replace('/(tabs)');
  }, [uid]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
