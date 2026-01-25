"""
Production settings
"""
from .base import *
import os

# Security settings
DEBUG = False

# 如果使用 HTTPS 代理，启用这些设置
USE_HTTPS = os.environ.get('USE_HTTPS', 'false').lower() == 'true'

if USE_HTTPS:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# 基础安全设置
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Session security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# 允许的主机（从环境变量读取，默认允许所有）
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Static files
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Logging for production
LOGGING['handlers']['file'] = {
    'level': 'INFO',
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': BASE_DIR.parent / 'data' / 'logs' / 'django.log',
    'maxBytes': 1024*1024*15,  # 15MB
    'backupCount': 10,
    'formatter': 'verbose',
}

LOGGING['handlers']['error_file'] = {
    'level': 'ERROR',
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': BASE_DIR.parent / 'data' / 'logs' / 'django_error.log',
    'maxBytes': 1024*1024*15,  # 15MB
    'backupCount': 10,
    'formatter': 'verbose',
}

LOGGING['root']['handlers'] = ['console', 'file']
LOGGING['loggers']['django']['handlers'] = ['console', 'file', 'error_file']
LOGGING['loggers']['apps']['handlers'] = ['console', 'file', 'error_file']

# Create logs directory if it doesn't exist
import os
os.makedirs(BASE_DIR.parent / 'data' / 'logs', exist_ok=True)

# Email settings for production
if config('EMAIL_HOST', default=''):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'