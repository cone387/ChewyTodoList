/**
 * ErrorBoundary — 全局错误边界
 * 捕获子组件渲染时的 JS 错误，防止白屏
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在此上报错误到 Sentry/Bugsnag 等
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#fef2f2',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#ef4444" />
          </View>

          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: 8 }}>
            出了点问题
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            应用遇到了意外错误。{'\n'}请尝试重新加载。
          </Text>

          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#8b5cf6',
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>重新加载</Text>
          </TouchableOpacity>

          {__DEV__ && this.state.error && (
            <ScrollView
              style={{
                marginTop: 24, maxHeight: 160,
                backgroundColor: '#f9fafb', borderRadius: 8,
                padding: 12, width: '100%',
              }}
            >
              <Text style={{ fontSize: 11, color: '#ef4444', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {this.state.error.message}
              </Text>
              <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {this.state.error.stack?.slice(0, 500)}
              </Text>
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}
