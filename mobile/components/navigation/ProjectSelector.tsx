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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Project } from '../../shared/types/index';
import { useProjects } from '../../hooks/useProjects';
import { Colors } from '../../constants/theme';

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

  const allProjects = projects as Project[];
  const selectedProject = allProjects.find((p: Project) => p.uid === selectedProjectUid);
  const label = selectedProject ? selectedProject.name : '全部项目';

  const filtered = allProjects.filter((p: Project) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          gap: 4,
        }}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="folder" size={14} color="#6b7280" />
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', maxWidth: 100 }} numberOfLines={1}>
          {label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={14} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '60%',
                paddingBottom: 34,
              }}>
                {/* Handle bar */}
                <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
                </View>

                <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418', marginBottom: 12 }}>选择项目</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: '#111418',
                    }}
                    placeholder="搜索项目..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                <FlatList
                  data={[{ uid: null, name: '全部项目' } as any, ...filtered]}
                  keyExtractor={(item) => item.uid || 'all'}
                  renderItem={({ item }) => {
                    const isSelected = item.uid === selectedProjectUid || (!item.uid && !selectedProjectUid);
                    return (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f9fafb',
                        }}
                        onPress={() => {
                          onSelect(item.uid);
                          setModalVisible(false);
                          setSearch('');
                        }}
                      >
                        <MaterialCommunityIcons
                          name={item.uid ? 'folder' : 'folder-multiple'}
                          size={18}
                          color={isSelected ? Colors.primary : '#9ca3af'}
                          style={{ marginRight: 10 }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: isSelected ? '600' : '400',
                            color: isSelected ? Colors.primary : '#374151',
                          }}
                        >
                          {item.name}
                        </Text>
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />

                {/* Cancel button */}
                <TouchableOpacity
                  style={{
                    marginHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  onPress={() => { setModalVisible(false); setSearch(''); }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#6b7280' }}>取消</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
