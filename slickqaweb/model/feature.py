from mongoengine import *


class Feature(EmbeddedDocument):
    id = ObjectIdField()
    name = StringField()
    description = StringField()
