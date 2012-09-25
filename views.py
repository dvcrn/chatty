from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from django.utils.datastructures import MultiValueDictKeyError
from chatty.fbauth import fbauth
from chatty import settings
from chatty.userdb.models import UserToken
import facebook
import simplejson

FACEBOOK_APP_ID = settings.FACEBOOK_APP_ID
FACEBOOK_APP_SECRET = settings.FACEBOOK_APP_SECRET
FACEBOOK_APP_CANVAS = settings.FACEBOOK_APP_CANVAS

fbauth = fbauth(FACEBOOK_APP_ID, FACEBOOK_APP_SECRET)

def _parse_request(signed_request):
    signed_data = fbauth.getSignedData(signed_request)
    return signed_data

def authPage(request):
    redirecturi = fbauth.getAuthuri(FACEBOOK_APP_CANVAS)

    response = render_to_response("redirect.html", {
        'redirecturi': redirecturi
    })
    return response

def chatPage(request):
    try: 
        request.POST['signed_request']
    except MultiValueDictKeyError:
        return authPage(request)
        sys.exit(0)

    facebook_signed_request = request.POST['signed_request']
    facebook_signed_data = _parse_request(facebook_signed_request)

    try:
        facebook_signed_data['oauth_token']
    except KeyError:
        return authPage(request)
        sys.exit(0)

    user_fbid = facebook_signed_data['user_id']
    user_oauth_token = facebook_signed_data['oauth_token']
    user_token_expires = facebook_signed_data['expires']
    
    try:
        ut = UserToken.objects.get(fbid=user_fbid)
        ut.expires = user_token_expires
        ut.token = user_oauth_token
        ut.save()
    except UserToken.DoesNotExist:
        ut = UserToken.objects.create(fbid=user_fbid, expires=user_token_expires, token=user_oauth_token)


    # Todo: Check ob das token noch gueltig ist. 

    return render_to_response('chat.html', {
        'user_fbid': user_fbid,
        'socket_uri': settings.CHATTY_SOCKET_URI
    }, context_instance=RequestContext(request))

def callbackPage(request):
    return render_to_response('callback.html', {
        
    }, context_instance=RequestContext(request))

def landingPage(request):
    return render_to_response('landingpage.html', {
        'socket_uri': settings.CHATTY_SOCKET_URI
    })

def dataRestPage(request, fbid):

    ut = UserToken.objects.get(fbid=fbid)

    api = facebook.GraphAPI(ut.token)
    profile = api.get_object("me")

    JSON = simplejson.dumps({
        'first_name': profile.get('first_name', "Not Set"),
        'last_name': profile.get('last_name', "Not Set"),
        
        'gender': profile.get('gender', "Not Set"),
        'id': profile.get('id', "Not Set"),

        'interested_in': profile.get('interested_in', ['Not Set']),
        'relationship_status': profile.get('relationship_status', "Not Set"),

        'birthday': profile.get('birthday', "Not Set"),
    })

    return render_to_response('jsonpage.html', { 'JSON': JSON }, context_instance=RequestContext(request))