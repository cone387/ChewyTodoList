import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditViewPage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-lg text-gray-600">编辑视图 {uid}（开发中）</Text>
    </View>
  );
}
