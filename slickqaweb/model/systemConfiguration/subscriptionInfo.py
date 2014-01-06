__author__ = 'jcorbett'

from mongoengine import *

class SubscriptionInfo(EmbeddedDocument):
    subscriptionType = StringField()
    subscriptionValue = StringField()
    onStart = BooleanField()
