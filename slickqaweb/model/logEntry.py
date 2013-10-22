from mongoengine import *
from .build import Build


class LogEntry(EmbeddedDocument):
    entryTime = DateTimeField()
    level = StringField()
    loggerName = StringField()
    message = StringField()
    exceptionClassName = StringField()
    exceptionMessage = StringField()
    exceptionStackTrace = ListField()

