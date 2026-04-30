import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { attachmentApi } from '../../../shared/services/api';
import type { Attachment } from '../../../shared/services/api';
import { ActionSheet } from '../../ui/ActionSheet';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { ProgressBar } from '../../ui/ProgressBar';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';

interface AttachmentListProps {
  attachments: any[];
  onContentInsert?: (text: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType?.startsWith('image/')) return '🖼';
  if (mimeType?.startsWith('video/')) return '🎬';
  if (mimeType?.startsWith('audio/')) return '🎵';
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
  return '📎';
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onContentInsert,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [showAttachmentActions, setShowAttachmentActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpload = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);
      formData.append('is_public', 'true');

      const res = await attachmentApi.upload(formData, (progress) => {
        setUploadProgress(progress / 100);
      });

      const attachment = res.data;
      if (onContentInsert && attachment.preview_url) {
        const isImage = mimeType.startsWith('image/');
        const insertText = isImage
          ? `\n![${attachment.original_name}](${attachment.preview_url})\n`
          : `\n[${attachment.original_name}](${attachment.preview_url})\n`;
        onContentInsert(insertText);
      }
      showToast('success', '上传成功');
    } catch (err) {
      showToast('error', '上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    setShowUploadOptions(false);
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showToast('error', '需要相机权限');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        await handleUpload(asset.uri, fileName, asset.mimeType || 'image/jpeg');
      }
    } catch {
      showToast('error', '选择图片失败');
    }
  };

  const handlePickFile = async () => {
    setShowUploadOptions(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleUpload(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
      }
    } catch {
      showToast('error', '选择文件失败');
    }
  };

  const handleDeleteAttachment = async () => {
    if (!selectedAttachment?.id) return;
    try {
      await attachmentApi.deleteAttachment(selectedAttachment.id);
      showToast('success', '附件已删除');
    } catch {
      showToast('error', '删除失败');
    }
    setShowDeleteConfirm(false);
    setSelectedAttachment(null);
  };

  return (
    <View style={{ backgroundColor: colors.card, marginTop: 8, paddingVertical: 14 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.secondary }}>附件</Text>
        <TouchableOpacity onPress={() => setShowUploadOptions(true)}>
          <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>+ 上传</Text>
        </TouchableOpacity>
      </View>

      {/* Upload progress */}
      {uploading && (
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <ProgressBar value={uploadProgress} color={Colors.primary} />
          <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 4, textAlign: 'center' }}>
            上传中 {Math.round(uploadProgress * 100)}%
          </Text>
        </View>
      )}

      {/* Attachment list */}
      {attachments.length > 0 ? (
        attachments.map((att, idx) => (
          <TouchableOpacity
            key={att.id || idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: idx < attachments.length - 1 ? 1 : 0,
              borderBottomColor: '#f9fafb',
            }}
            onLongPress={() => { setSelectedAttachment(att); setShowAttachmentActions(true); }}
          >
            <Text style={{ fontSize: 20, marginRight: 10 }}>{getFileIcon(att.mime_type)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.text.secondary }} numberOfLines={1}>{att.original_name || att.name || '附件'}</Text>
              <Text style={{ fontSize: 11, color: colors.text.muted }}>{att.size ? formatFileSize(att.size) : ''}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : null}

      {/* Upload options */}
      <ActionSheet
        visible={showUploadOptions}
        title="上传附件"
        options={[
          { label: '拍照', value: 'camera', icon: '📷' },
          { label: '从相册选择', value: 'gallery', icon: '🖼' },
          { label: '选择文件', value: 'file', icon: '📁' },
        ]}
        onSelect={(opt) => {
          if (opt.value === 'camera') handlePickImage(true);
          else if (opt.value === 'gallery') handlePickImage(false);
          else if (opt.value === 'file') handlePickFile();
        }}
        onCancel={() => setShowUploadOptions(false)}
      />

      {/* Attachment actions */}
      <ActionSheet
        visible={showAttachmentActions}
        title={selectedAttachment?.original_name || '附件'}
        options={[
          { label: '删除附件', value: 'delete', icon: '🗑', color: colors.error, destructive: true },
        ]}
        onSelect={(opt) => {
          if (opt.value === 'delete') setShowDeleteConfirm(true);
          setShowAttachmentActions(false);
        }}
        onCancel={() => { setShowAttachmentActions(false); setSelectedAttachment(null); }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除附件"
        message={`确认删除「${selectedAttachment?.original_name}」？`}
        confirmText="删除"
        destructive
        onConfirm={handleDeleteAttachment}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedAttachment(null); }}
      />
    </View>
  );
};
