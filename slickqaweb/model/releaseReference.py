from mongoengine import *


class BuildReference(EmbeddedDocument):
    buildId = ObjectIdField()
    name = StringField()