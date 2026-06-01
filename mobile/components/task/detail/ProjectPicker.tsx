import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjects } from '../../../hooks/useProjects';
import { useGroups } from '../../../hooks/useGroups';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import type { Project, Group } from '../../../shared/types/index';

interface ProjectPickerProps {
  visible: boolean;
  selectedProjectUid?: string | null;
  onSelectProject: (projectUid: string | null) => void;
  onClose: () => void;
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  visible,
  selectedProjectUid,
  onSelectProject,
  onClose,
}) => {
  const { colors } = useTheme();
  const { data: projectsData } = useProjects();
  const { data: groupsData } = useGroups();

  const [search, setSearch] = useState('');

  const projects: Project[] = useMemo(
    () => (projectsData as Project[]) || [],
    [projectsData]
  );
  const groups: Group[] = useMemo(
    () => (groupsData as Group[]) || [],
    [groupsData]
  );

  const filteredProjects = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  // Group projects by group
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();
    filteredProjects.forEach((project) => {
      const groupName = project.group?.name || '未分组';
      if (!map.has(groupName)) {
        map.set(groupName, []);
      }
      map.get(groupName)!.push(project);
    });
    return Array.from(map.entries());
  }, [filteredProjects]);

  const selectedProject = projects.find((p) => p.uid === selectedProjectUid);

  const handleSelectNone = () => {
    onSelectProject(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '70%',
                paddingBottom: 34,
              }}
            >
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.text.muted,
                  }}
                />
              </View>

              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: colors.text.primary,
                    marginBottom: 12,
                  }}
                >
                  选择项目
                </Text>

                {/* Search */}
                <TextInput
                  style={{
                    backgroundColor: colors.background.tertiary,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 14,
                    color: colors.text.primary,
                    marginBottom: 12,
                  }}
                  placeholder="搜索项目..."
                  placeholderTextColor={colors.text.muted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <ScrollView style={{ paddingHorizontal: 16 }}>
                {/* No project option */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  }}
                  onPress={handleSelectNone}
                >
                  <MaterialCommunityIcons
                    name="folder-remove"
                    size={20}
                    color={colors.text.muted}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: !selectedProjectUid ? colors.primary : colors.text.secondary,
                      fontWeight: !selectedProjectUid ? '600' : '400',
                    }}
                  >
                    无项目
                  </Text>
                  {!selectedProjectUid && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>

                {/* Grouped projects */}
                {groupedProjects.map(([groupName, groupProjects]) => (
                  <View key={groupName}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.text.muted,
                        marginTop: 12,
                        marginBottom: 4,
                      }}
                    >
                      {groupName}
                    </Text>
                    {groupProjects.map((project) => {
                      const isSelected = project.uid === selectedProjectUid;
                      return (
                        <TouchableOpacity
                          key={project.uid}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.borderLight,
                          }}
                          onPress={() => {
                            onSelectProject(project.uid);
                            onClose();
                          }}
                        >
                          {/* Project color dot */}
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: project.style?.color || Colors.primary,
                              marginRight: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialCommunityIcons
                              name={project.style?.icon || 'folder'}
                              size={12}
                              color="#fff"
                            />
                          </View>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 15,
                              color: isSelected ? colors.primary : colors.text.secondary,
                              fontWeight: isSelected ? '600' : '400',
                            }}
                          >
                            {project.name}
                          </Text>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check"
                              size={20}
                              color={Colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                {filteredProjects.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <MaterialCommunityIcons
                      name="folder-search"
                      size={48}
                      color={colors.text.muted}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={{ color: colors.text.muted, fontSize: 14 }}>
                      {search ? '未找到匹配的项目' : '暂无项目'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
