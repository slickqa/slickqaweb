from mongoengine import *


class ReleaseReference(EmbeddedDocument):
    releaseId = ObjectIdField()
    name = StringField()