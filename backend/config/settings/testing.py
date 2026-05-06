"""
Testing settings
"""
from .base import *

# Remove chewy_attachment in tests — python-magic hangs on Windows when libmagic DLL is absent
INSTALLED_APPS = [a for a in INSTALLED_APPS if 'chewy_attachment' not in a]

# Use a URL conf that doesn't include chewy_attachment URLs
ROOT_URLCONF = 'config.urls_testing'

# Allow Django test client's default host
ALLOWED_HOSTS = ['*']

# Use in-memory database for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Password hashers for faster tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable logging during tests
LOGGING_CONFIG = None

# Media files for tests
MEDIA_ROOT = '/tmp/test_media'

# Cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}