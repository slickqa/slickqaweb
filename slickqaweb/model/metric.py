from slickqaweb.model.buildReference import BuildReference
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.releaseReference import ReleaseReference

__author__ = 'geoff'

from mongoengine import *


class Measurement(EmbeddedDocument):
    value = StringField(required=True)
    name = StringField(required=True)

class Metric(Document):
    name = StringField()
    measurements = ListField(EmbeddedDocumentField(Measurement))
    type = StringField()
    unit = StringField()
    project = EmbeddedDocumentField(ProjectReference)
    release = EmbeddedDocumentField(ReleaseReference)
    build = EmbeddedDocumentField(BuildReference)
    dateCreated = DateTimeField()

    meta = {'collection': 'metrics'}