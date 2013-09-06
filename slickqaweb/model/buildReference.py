from mongoengine import *


class ConfigurationReference(EmbeddedDocument):
    configId = ObjectIdField()
    name = StringField()
    filename = StringField()