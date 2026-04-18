import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { useTags, useCreateTag } from '../../../hooks/useTags';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import type { Tag } from '../../../shared/types/index';

interface TagPickerProps {
  visible: boolean;
  selectedTagUids: string[];
  onToggleTag: (tagUid: string) => void;
  onClose: () => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  visible,
  selectedTagUids,
  onToggleTag,
  onClose,
}) => {
  const { data: tagsData } = useTags();
  const createTag = useCreateTag();
  const { showToast } = useToast();
  const tags: Tag[] = (tagsData as Tag[]) || [];

  const [search, setSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const filteredTags = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await createTag.mutateAsync({ name: newTagName.trim() });
      const newTag = res.data.data;
      onToggleTag(newTag.uid);
      setNewTagName('');
      showToast('success', '标签已创建');
    } catch {
      showToast('error', '创建标签失败');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 34 }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
              </View>

              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#111418', marginBottom: 12 }}>选择标签</Text>

                {/* Search */}
                <TextInput
                  style={{ backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111418', marginBottom: 12 }}
                  placeholder="搜索标签..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <ScrollView style={{ paddingHorizontal: 16 }}>
                {filteredTags.map((tag) => {
                  const isSelected = selectedTagUids.includes(tag.uid);
                  return (
                    <TouchableOpacity
                      key={tag.uid}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                      }}
                      onPress={() => onToggleTag(tag.uid)}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: tag.color, marginRight: 12 }} />
                      <Text style={{ flex: 1, fontSize: 15, color: '#374151' }}>{tag.name}</Text>
                      {isSelected && (
                        <Text style={{ color: Colors.primary, fontSize: 18, fontWeight: '600' }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {filteredTags.length === 0 && !search && (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>暂无标签</Text>
                  </View>
                )}
              </ScrollView>

              {/* Create new tag */}
              <View style={{ paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111418' }}
                    placeholder="创建新标签..."
                    placeholderTextColor="#9ca3af"
                    value={newTagName}
                    onChangeText={setNewTagName}
                    returnKeyType="done"
                    onSubmitEditing={handleCreateTag}
                  />
                  <TouchableOpacity
                    onPress={handleCreateTag}
                    style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>创建</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
