from mongoengine import *


class Component(EmbeddedDocument):
    id = ObjectIdField()
    code = StringField()
    description = StringField()
    name = StringField()