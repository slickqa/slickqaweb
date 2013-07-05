from mongoengine import *


class Component(EmbeddedDocument):
    code = StringField()
    description = StringField()
    name = StringField()