__author__ = 'jcorbett'

from mongoengine import *
from .componentReference import ComponentReference
from .projectReference import ProjectReference
from .step import Step


class Testcase(Document):
    meta = {'collection': 'testcases'}
    name = StringField()
    purpose = StringField()
    requirements = StringField()
    author = StringField()
    steps = ListField(EmbeddedDocumentField(Step))
    attributes = MapField(StringField())
    automated = BooleanField()
    automationPriority = IntField()
    automationTool = StringField()
    automationId = StringField()
    automationKey = StringField()
    automationConfiguration = StringField()
    stabilityRating = IntField()
    tags = ListField(StringField())
    project = EmbeddedDocumentField(ProjectReference)
    component = EmbeddedDocumentField(ComponentReference)
    deleted = BooleanField()

