import urllib
import urllib2
from urlparse import urlparse
from django.utils import simplejson
import base64
import simplejson

class fbauth:

    def __base64_url_decode(self, inp):
        padding_factor = (4 - len(inp) % 4) % 4
        inp += "="*padding_factor
        return base64.b64decode(unicode(inp).translate(dict(zip(map(ord, u'-_'), u'+/'))))

    def __parseSignedRequest(self, signedRequest):
        requestSplit = signedRequest.split(".")
        parsedRequest = []
        parsedRequest.append(self.__base64_url_decode(requestSplit[0]))
        parsedRequest.append(simplejson.loads(self.__base64_url_decode(requestSplit[1])))
        return parsedRequest

    def __readToken(self, authcode, redirect_uri):
        # Reads the oauth access token from graph.facebook.com
        res = urllib2.urlopen("https://graph.facebook.com/oauth/access_token?client_id=%s&client_secret=%s&code=%s&redirect_uri=%s" % (self.appId, self.appSecret, authcode, redirect_uri))
        token = res.read();

        # Splits the string to key / value
        arr = []
        for tokenpiece in token.split("&"):
            arr.append(tokenpiece.split("=")[1])

        # Returns the value. [0] = token, [1] = duration
        return arr

    def __init__(self, appId, appSecret):
        self.appId = appId
        self.appSecret = appSecret

    def getAuthuri(self, redirect_uri):
        uri = str("https://www.facebook.com/dialog/oauth?client_id=%s&redirect_uri=%s" % (self.appId, redirect_uri))
        return uri

    def getOauthToken(self, authcode, redirect_uri):
        return self.__readToken(authcode, redirect_uri)[0]

    def getTokenDuration(self, authcode, redirect_uri):
        return self.__readToken(authcode, redirect_uri)[1]

    def getSignedData(self, signedRequest):
        parsedData =  self.__parseSignedRequest(signedRequest)[1]
        return parsedData

    def getSignedSignature(self, signedRequest):
        parsedData =  self.__parseSignedRequest(signedRequest)[0]
        return parsedData