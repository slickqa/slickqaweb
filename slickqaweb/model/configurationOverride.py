from mongoengine import *


class ConfigurationOverride(EmbeddedDocument):
    key = StringField()
    value = StringField()
    isRequirement = BooleanField()