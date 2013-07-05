from mongoengine import *


class Build(EmbeddedDocument):
    built = DateTimeField()
    name = StringField()