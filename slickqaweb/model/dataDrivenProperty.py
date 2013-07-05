from mongoengine import *


class DataDrivenProperty(EmbeddedDocument):
    name = StringField()
    requirement = BooleanField()
    standardValues = ListField(StringField())