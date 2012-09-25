import os
import sys
 
path = '/var/www/apps'
if path not in sys.path:
    sys.path.insert(0, '/var/www/apps')
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'chatty.settings'
 
import django.core.handlers.wsgi

# Workaround for readv() error
class ForcePostHandler(django.core.handlers.wsgi.WSGIHandler):
    """Workaround for: http://lists.unbit.it/pipermail/uwsgi/2011-February/001395.html
    """
    def get_response(self, request):
        request.POST # force reading of POST data
        return super(ForcePostHandler, self).get_response(request)

application = ForcePostHandler()
#application = django.core.handlers.wsgi.WSGIHandler()