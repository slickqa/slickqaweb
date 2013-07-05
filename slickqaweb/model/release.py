from mongoengine import *
from .build import Build


class Release(EmbeddedDocument):
    builds = ListField(EmbeddedDocumentField(Build))
    defaultBuild = StringField()
    name = StringField(required=True)
    target = DateTimeField()
