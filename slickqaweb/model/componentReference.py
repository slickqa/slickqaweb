from mongoengine import *


class ComponentReference(EmbeddedDocument):
    id = ObjectIdField()
    code = StringField()
    name = StringField()