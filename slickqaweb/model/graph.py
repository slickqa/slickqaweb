__author__ = 'sjensen'

from mongoengine import *


class GraphColumnsReference(EmbeddedDocument):
    type = StringField(required=True)
    name = StringField(required=True)


class GraphValuesReference(EmbeddedDocument):
    date = DateTimeField(required=True)
    measurements = ListField(IntField(required=True))


class Graph(EmbeddedDocument):
    columns = ListField(EmbeddedDocumentField(GraphColumnsReference))
    values = ListField(EmbeddedDocumentField(GraphValuesReference))