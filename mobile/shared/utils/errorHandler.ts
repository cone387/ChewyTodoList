/**
 * 错误处理工具 - 统一错误类型和用户友好提示
 */

/**
 * 友好的错误消息映射
 */
export const getFriendlyErrorMessage = (error: any): string => {
  // 网络错误
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return '网络请求超时，请检查网络连接后重试';
  }

  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return '网络连接失败，请检查网络设置';
  }

  // HTTP 状态码错误
  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      return data?.message || data?.detail || '请求参数错误';
    
    case 401:
      return '登录已过期，请重新登录';
    
    case 403:
      return '没有权限执行此操作';
    
    case 404:
      return '请求的内容不存在';
    
    case 409:
      return data?.message || data?.detail || '数据冲突';
    
    case 422:
      return data?.message || data?.detail || '数据验证失败';
    
    case 500:
      return '服务器错误，请稍后重试';
    
    case 502:
      return '服务器维护中，请稍后重试';
    
    case 503:
      return '服务暂时不可用，请稍后重试';
    
    default:
      return data?.message || data?.detail || error.message || '操作失败，请重试';
  }
};

/**
 * 错误分类
 */
export enum ErrorType {
  NETWORK = 'NETWORK',          // 网络错误
  AUTH = 'AUTH',               // 认证错误
  PERMISSION = 'PERMISSION',   // 权限错误
  VALIDATION = 'VALIDATION',   // 验证错误
  SERVER = 'SERVER',           // 服务器错误
  UNKNOWN = 'UNKNOWN',         // 未知错误
}

/**
 * 获取错误类型
 */
export const getErrorType = (error: any): ErrorType => {
  if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
    return ErrorType.NETWORK;
  }

  const status = error.response?.status;
  switch (status) {
    case 401:
      return ErrorType.AUTH;
    case 403:
      return ErrorType.PERMISSION;
    case 400:
    case 422:
      return ErrorType.VALIDATION;
    case 500:
    case 502:
    case 503:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
};

/**
 * 是否需要重新登录
 */
export const shouldRelogin = (error: any): boolean => {
  return error.response?.status === 401 || 
         error.response?.data?.code === 'token_expired';
};

/**
 * 记录错误日志（可用于后续接入 Sentry）
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    url: error.config?.url,
    context,
    timestamp: new Date().toISOString(),
  };

  // 开发环境打印详细日志
  if (__DEV__) {
    console.error(`[Error] ${context || 'Unknown'}:`, errorInfo);
  }

  // TODO: 生产环境上报到 Sentry
  // if (!__DEV__) {
  //   Sentry.captureException(error, { contexts: { errorInfo } });
  // }
};
