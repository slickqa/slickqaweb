from mongoengine import *


class Build(EmbeddedDocument):
    id = ObjectIdField()
    built = DateTimeField()
    name = StringField()
    description = StringField()
    attributes = MapField(StringField())