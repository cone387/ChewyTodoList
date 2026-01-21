"""
Production settings
"""
from .base import *

# Security settings
DEBUG = False
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Session security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

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