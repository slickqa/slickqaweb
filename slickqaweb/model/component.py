from mongoengine import *
from .feature import Feature


class Component(EmbeddedDocument):
    id = ObjectIdField()
    code = StringField()
    description = StringField()
    name = StringField()
    features = ListField(EmbeddedDocumentField(Feature))