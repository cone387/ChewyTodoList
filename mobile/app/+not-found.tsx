import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 16 }}>页面不存在</Text>
      <Link href="/" style={{ color: Colors.primary, fontSize: 16 }}>
        返回首页
      </Link>
    </View>
  );
}
