from mongoengine import *
from .build import Build


class Release(EmbeddedDocument):
    id = ObjectIdField()
    builds = ListField(EmbeddedDocumentField(Build))
    defaultBuild = StringField()
    status = StringField(choices=('active', 'inactive'), default='active')
    name = StringField(required=True)
    target = DateTimeField()
    attributes = MapField(StringField())
