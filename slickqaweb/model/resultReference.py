from mongoengine import *
from buildReference import BuildReference


class ResultReference(EmbeddedDocument):
    resultId = ObjectIdField()
    status = StringField()
    recorded = DateTimeField()
    build = EmbeddedDocumentField(BuildReference)