__author__ = 'jcorbett'

from mongoengine import *
from datetime import datetime

def current_time():
    return datetime.now()

class UserAccount(Document):
    meta = {'collection': 'user-accounts'}
    openid = StringField(required=True)
    email = EmailField(required=True)
    full_name = StringField()
    short_name = StringField()
    last_login = DateTimeField(default=current_time)
    preferences = DictField()
