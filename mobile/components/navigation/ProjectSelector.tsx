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
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface ProjectSelectorProps {
  selectedProjectUid: string | null;
  onSelect: (uid: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectUid,
  onSelect,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const { data: projects = [] } = useProjects();

  const allProjects = projects as Project[];
  const selectedProject = allProjects.find((p: Project) => p.uid === selectedProjectUid);
  const label = selectedProject ? selectedProject.name : '全部任务';

  const filtered = allProjects.filter((p: Project) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary }} numberOfLines={1}>
          {label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text.muted} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                maxHeight: '60%', paddingBottom: 34,
              }}>
                <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.text.muted }} />
                </View>

                <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>选择项目</Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: colors.background.tertiary, borderRadius: 12,
                    paddingHorizontal: 12, height: 40,
                  }}>
                    <MaterialCommunityIcons name="magnify" size={18} color={colors.text.muted} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, color: colors.text.primary, paddingVertical: 0, marginLeft: 8 }}
                      placeholder="搜索项目..."
                      placeholderTextColor={colors.text.muted}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                </View>

                <FlatList
                  data={[{ uid: null, name: '全部任务' } as any, ...filtered]}
                  keyExtractor={(item) => item.uid || 'all'}
                  renderItem={({ item }) => {
                    const isSelected = item.uid === selectedProjectUid || (!item.uid && !selectedProjectUid);
                    return (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 16, paddingVertical: 14,
                          borderBottomWidth: 1, borderBottomColor: '#f9fafb',
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
                          color={isSelected ? Colors.primary : colors.text.muted}
                          style={{ marginRight: 10 }}
                        />
                        <Text style={{
                          flex: 1, fontSize: 15,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? Colors.primary : colors.text.secondary,
                        }}>
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

                <TouchableOpacity
                  style={{
                    marginHorizontal: 16, paddingVertical: 14,
                    backgroundColor: colors.background.tertiary, borderRadius: 12, alignItems: 'center',
                  }}
                  onPress={() => { setModalVisible(false); setSearch(''); }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text.secondary }}>取消</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
