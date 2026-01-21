"""
Development settings
"""
from .base import *

# Debug toolbar
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
        
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
        }
    except ImportError:
        pass

# Django extensions
if 'django_extensions' in INSTALLED_APPS:
    SHELL_PLUS_PRINT_SQL = True

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False

# Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Logging for development
LOGGING['handlers']['file'] = {
    'level': 'DEBUG',
    'class': 'logging.FileHandler',
    'filename': BASE_DIR.parent / 'data' / 'logs' / 'django.log',
    'formatter': 'verbose',
}

LOGGING['root']['handlers'].append('file')
LOGGING['loggers']['django']['handlers'].append('file')
LOGGING['loggers']['apps']['handlers'].append('file')

# Create logs directory if it doesn't exist
import os
os.makedirs(BASE_DIR.parent / 'data' / 'logs', exist_ok=True)