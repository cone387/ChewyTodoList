import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import type { Project } from '../../shared/types/index';
import { useProjects } from '../../hooks/useProjects';

interface ProjectSelectorProps {
  selectedProjectUid: string | null;
  onSelect: (uid: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectUid,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const { data: projects = [] } = useProjects();

  const selectedProject = projects.find((p) => p.uid === selectedProjectUid);
  const label = selectedProject ? selectedProject.name : '全部项目';

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-1.5"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
          📁 {label}
        </Text>
        <Text className="text-gray-400 text-xs">▾</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-2xl max-h-96">
                <View className="px-4 pt-4 pb-2">
                  <Text className="text-base font-semibold text-gray-900 mb-3">选择项目</Text>
                  <TextInput
                    className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800"
                    placeholder="搜索项目..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
                <FlatList
                  data={[{ uid: null, name: '全部项目' } as any, ...filtered]}
                  keyExtractor={(item) => item.uid || 'all'}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="px-4 py-3.5 flex-row items-center border-b border-gray-50"
                      onPress={() => {
                        onSelect(item.uid);
                        setModalVisible(false);
                        setSearch('');
                      }}
                    >
                      <Text className="text-sm mr-2">{item.uid ? '📁' : '🗂️'}</Text>
                      <Text
                        className="flex-1 text-base"
                        style={{ color: item.uid === selectedProjectUid || (!item.uid && !selectedProjectUid) ? '#8b5cf6' : '#111418' }}
                      >
                        {item.name}
                      </Text>
                      {(item.uid === selectedProjectUid || (!item.uid && !selectedProjectUid)) && (
                        <Text className="text-purple-500">✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
