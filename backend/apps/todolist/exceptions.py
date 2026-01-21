from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """自定义异常处理器"""
    
    # 调用 DRF 默认的异常处理器
    response = exception_handler(exc, context)
    
    if response is not None:
        # 记录异常日志
        logger.error(
            f"API Exception: {exc.__class__.__name__}: {str(exc)}",
            extra={
                'request': context.get('request'),
                'view': context.get('view'),
                'exc_info': exc,
            }
        )
        
        # 自定义错误响应格式
        custom_response_data = {
            'success': False,
            'error': {
                'code': get_error_code(exc),
                'message': get_error_message(exc, response.data),
                'details': get_error_details(response.data),
            },
            'timestamp': timezone.now().isoformat(),
        }
        
        response.data = custom_response_data
    
    return response


def get_error_code(exc):
    """获取错误代码"""
    error_codes = {
        'ValidationError': 'VALIDATION_ERROR',
        'AuthenticationFailed': 'AUTH_001',
        'NotAuthenticated': 'AUTH_001',
        'PermissionDenied': 'AUTH_004',
        'NotFound': 'BUSINESS_001',
        'MethodNotAllowed': 'BUSINESS_002',
        'ParseError': 'VALIDATION_002',
        'UnsupportedMediaType': 'VALIDATION_002',
        'Throttled': 'RATE_LIMIT_EXCEEDED',
    }
    
    return error_codes.get(exc.__class__.__name__, 'UNKNOWN_ERROR')


def get_error_message(exc, response_data):
    """获取错误消息"""
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, dict):
            # 获取第一个字段的错误消息
            for field, messages in exc.detail.items():
                if isinstance(messages, list) and messages:
                    return f"{field}: {messages[0]}"
                return f"{field}: {messages}"
        elif isinstance(exc.detail, list) and exc.detail:
            return str(exc.detail[0])
        else:
            return str(exc.detail)
    
    return str(exc)


def get_error_details(response_data):
    """获取错误详情"""
    if isinstance(response_data, dict):
        return response_data
    elif isinstance(response_data, list):
        return {'non_field_errors': response_data}
    else:
        return {'detail': response_data}