from django.db import models

# Create your models here.
class UserToken(models.Model):
	fbid = models.BigIntegerField(unique=True)
	expires = models.IntegerField()
	token = models.TextField(max_length=200)
	updated = models.DateTimeField(auto_now=True)