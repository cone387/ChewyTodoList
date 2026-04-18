import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditViewPage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, color: '#6b7280' }}>编辑视图 {uid}（开发中）</Text>
    </View>
  );
}
