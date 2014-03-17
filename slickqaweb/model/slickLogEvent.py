__author__ = 'jcorbett'

from mongoengine import *
import datetime

class EventTypes:
    CREATED = "CREATED"
    DELETED = "DELETED"
    MODIFIED = "MODIFIED"
    MESSAGE = "MESSAGE"

    @classmethod
    def types(cls):
        return [EventTypes.CREATED,
                EventTypes.DELETED,
                EventTypes.MODIFIED,
                EventTypes.MESSAGE]

class SlickLogEvent(Document):
    meta = {'collection': 'logevents'}
    occurred = DateTimeField(default=datetime.datetime.now)
    fieldType = StringField()
    eventType = StringField(required=True, choices=EventTypes.types())
    user = StringField(required=True, default="Anonymous")
    targetid = StringField()
    name = StringField()
    message = StringField()
