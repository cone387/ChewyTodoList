import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '页面不存在' }} />
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-xl font-bold text-gray-800 mb-4">页面不存在</Text>
        <Link href="/" className="text-purple-600 text-base">
          返回首页
        </Link>
      </View>
    </>
  );
}
