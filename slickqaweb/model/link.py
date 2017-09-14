from mongoengine import *


class Link(EmbeddedDocument):
    name = StringField()
    url = URLField()
