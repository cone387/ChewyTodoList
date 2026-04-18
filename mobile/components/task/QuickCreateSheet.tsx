import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useCreateTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useToast } from '../../hooks/useToast';
import { Colors } from '../../constants/theme';
import { TaskPriority } from '../../shared/types/index';
import type { Project } from '../../shared/types/index';

const PRIORITY_OPTIONS = [
  { label: '低', value: TaskPriority.LOW, color: Colors.priority.low },
  { label: '中', value: TaskPriority.MEDIUM, color: Colors.priority.medium },
  { label: '高', value: TaskPriority.HIGH, color: Colors.priority.high },
  { label: '紧急', value: TaskPriority.URGENT, color: Colors.priority.urgent },
];

interface QuickCreateSheetProps {
  visible: boolean;
  onClose: () => void;
  defaultProjectUid?: string | null;
}

export const QuickCreateSheet: React.FC<QuickCreateSheetProps> = ({
  visible,
  onClose,
  defaultProjectUid,
}) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const titleRef = useRef<TextInput>(null);
  const createTask = useCreateTask();
  const { data: projectsData } = useProjects();
  const { showToast } = useToast();

  const projects: Project[] = (projectsData as Project[]) || [];

  const [title, setTitle] = useState('');
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(defaultProjectUid || null);
  const [priority, setPriority] = useState<number>(TaskPriority.MEDIUM);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle('');
      setTitleError('');
      setPriority(TaskPriority.MEDIUM);
      setSelectedProjectUid(defaultProjectUid || null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        setTimeout(() => titleRef.current?.focus(), 100);
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('请输入任务标题');
      return;
    }
    setTitleError('');

    try {
      const data: Record<string, any> = { title: trimmed, priority };
      if (selectedProjectUid) {
        data.project_uid = selectedProjectUid;
      }
      await createTask.mutateAsync(data);
      showToast('success', '任务创建成功');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || '创建失败，请重试';
      showToast('error', msg);
    }
  };

  const selectedProject = projects.find((p: Project) => p.uid === selectedProjectUid);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  transform: [{ translateY: slideAnim }],
                  backgroundColor: '#fff',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingBottom: 34,
                }}
              >
                {/* Handle bar */}
                <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
                </View>

                <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#111418', marginBottom: 16 }}>
                    快速创建任务
                  </Text>

                  {/* Title input */}
                  <TextInput
                    ref={titleRef}
                    style={{
                      fontSize: 16,
                      color: '#111418',
                      borderWidth: 1,
                      borderColor: titleError ? '#ef4444' : '#e5e7eb',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      backgroundColor: '#f9fafb',
                    }}
                    placeholder="任务标题"
                    placeholderTextColor="#9ca3af"
                    value={title}
                    onChangeText={(t) => { setTitle(t); if (titleError) setTitleError(''); }}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  {titleError ? (
                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{titleError}</Text>
                  ) : null}

                  {/* Project selector */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: '#f9fafb',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                    onPress={() => setShowProjectPicker(!showProjectPicker)}
                  >
                    <Text style={{ color: '#9ca3af', fontSize: 14, marginRight: 8 }}>📁</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: selectedProject ? '#374151' : '#9ca3af' }}>
                      {selectedProject ? selectedProject.name : '选择项目（可选）'}
                    </Text>
                    <Text style={{ color: '#9ca3af' }}>{showProjectPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {showProjectPicker && (
                    <ScrollView style={{ maxHeight: 150, marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff' }}>
                      <TouchableOpacity
                        style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                        onPress={() => { setSelectedProjectUid(null); setShowProjectPicker(false); }}
                      >
                        <Text style={{ fontSize: 14, color: '#9ca3af' }}>不选择项目</Text>
                      </TouchableOpacity>
                      {projects.map((p: Project) => (
                        <TouchableOpacity
                          key={p.uid}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f3f4f6',
                            backgroundColor: p.uid === selectedProjectUid ? '#f3f0ff' : '#fff',
                          }}
                          onPress={() => { setSelectedProjectUid(p.uid); setShowProjectPicker(false); }}
                        >
                          <Text style={{ fontSize: 14, color: '#374151' }}>{p.name}</Text>
                          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{p.group?.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {/* Priority selector */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>优先级</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 10,
                            alignItems: 'center',
                            backgroundColor: priority === opt.value ? opt.color + '18' : '#f9fafb',
                            borderWidth: 1,
                            borderColor: priority === opt.value ? opt.color : '#e5e7eb',
                          }}
                          onPress={() => setPriority(opt.value)}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '500', color: priority === opt.value ? opt.color : '#6b7280' }}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Submit button */}
                  <TouchableOpacity
                    style={{
                      marginTop: 20,
                      backgroundColor: Colors.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: createTask.isPending ? 0.7 : 1,
                    }}
                    onPress={handleSubmit}
                    disabled={createTask.isPending}
                  >
                    {createTask.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>创建任务</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
