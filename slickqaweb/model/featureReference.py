from mongoengine import *


class FeatureReference(EmbeddedDocument):
    id = ObjectIdField()
    name = StringField()
