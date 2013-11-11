from mongoengine import *


class Configuration(Document):
    configurationData = DictField()
    configurationType = StringField()
    filename = StringField()
    name = StringField()
    meta = {'collection': 'configurations'}
