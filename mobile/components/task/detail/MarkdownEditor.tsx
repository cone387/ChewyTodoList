import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  footerText?: string;
  autoFocus?: boolean;
}

const TOOLS = [
  { icon: 'format-bold', label: 'B', prefix: '**', suffix: '**' },
  { icon: 'format-italic', label: 'I', prefix: '*', suffix: '*' },
  { icon: 'format-strikethrough-variant', label: 'S', prefix: '~~', suffix: '~~' },
  { icon: 'code-tags', label: '`', prefix: '`', suffix: '`' },
  { icon: 'format-header-1', label: 'H1', prefix: '# ', suffix: '' },
  { icon: 'format-header-2', label: 'H2', prefix: '## ', suffix: '' },
  { icon: 'format-list-bulleted', label: '•', prefix: '- ', suffix: '' },
  { icon: 'format-list-numbered', label: '1.', prefix: '1. ', suffix: '' },
  { icon: 'checkbox-marked-outline', label: '☑', prefix: '- [ ] ', suffix: '' },
  { icon: 'link-variant', label: '🔗', prefix: '[', suffix: '](url)' },
  { icon: 'code-braces', label: '```', prefix: '```\n', suffix: '\n```' },
  { icon: 'format-quote-open', label: '>', prefix: '> ', suffix: '' },
  { icon: 'minus', label: '—', prefix: '\n---\n', suffix: '' },
] as const;

export const MarkdownEditor: React.FC<Props> = ({ value, onChange, placeholder, editable = true, footerText, autoFocus = false }) => {
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const insertMarkdown = (prefix: string, suffix: string) => {
    const before = value.substring(0, selection.start);
    const selected = value.substring(selection.start, selection.end);
    const after = value.substring(selection.end);

    if (selected) {
      // Wrap selection
      const newText = before + prefix + selected + suffix + after;
      onChange(newText);
    } else {
      // Insert at cursor — for line-start prefixes (headers, lists), insert at line start
      const isLinePrefix = !suffix && (prefix.startsWith('#') || prefix.startsWith('-') || prefix.startsWith('1.') || prefix.startsWith('>'));
      if (isLinePrefix) {
        // Find start of current line
        const lineStart = before.lastIndexOf('\n') + 1;
        const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        onChange(newText);
      } else {
        const newText = before + prefix + suffix + after;
        onChange(newText);
        // Move cursor between prefix and suffix
        setTimeout(() => {
          inputRef.current?.setNativeProps?.({ selection: { start: selection.start + prefix.length, end: selection.start + prefix.length } });
        }, 50);
      }
    }
    inputRef.current?.focus();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Editor — fills all available space */}
      <TextInput
        ref={inputRef}
        style={{
          flex: 1, fontSize: 15, color: '#374151', lineHeight: 24,
          paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        }}
        placeholder={placeholder || '输入内容... (支持 Markdown)'}
        placeholderTextColor="#c4c4c4"
        value={value}
        onChangeText={onChange}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        multiline
        textAlignVertical="top"
        editable={editable}
        autoFocus={autoFocus}
      />

      {/* Footer meta text — right-aligned inside editor */}
      {footerText && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 4, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#d1d5db' }}>{footerText}</Text>
        </View>
      )}

      {/* Toolbar */}
      {editable && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, gap: 2 }}>
            {TOOLS.map((tool, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => insertMarkdown(tool.prefix, tool.suffix)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#f9fafb',
                }}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name={tool.icon as any} size={18} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
