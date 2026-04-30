import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.secondary, marginBottom: 16 }}>页面不存在</Text>
      <Link href="/" style={{ color: Colors.primary, fontSize: 16 }}>
        返回首页
      </Link>
    </View>
  );
}
