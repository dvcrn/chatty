from django.conf.urls.defaults import patterns, include, url
from views import * 

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'chatty.views.home', name='home'),
    # url(r'^chatty/', include('chatty.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),

    (r'^chatty/$', landingPage),
    (r'^chatty/chat/$', chatPage),
    (r'^chatty/rest/(?P<fbid>[0-9]+)/$', dataRestPage),
    (r'^chatty/auth/$', authPage),
    (r'^chatty/callback/$', callbackPage),
)
