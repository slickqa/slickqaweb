__author__ = 'jcorbett'

from mongoengine import *
from .componentReference import ComponentReference
from .projectReference import ProjectReference
from .featureReference import FeatureReference
from .recurringNote import RecurringNote
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
    importanceRating = IntField(min_value=0,max_value=5,default=0)
    tags = ListField(StringField())
    project = EmbeddedDocumentField(ProjectReference)
    component = EmbeddedDocumentField(ComponentReference)
    feature = EmbeddedDocumentField(FeatureReference)
    deleted = BooleanField()
    activeNotes = ListField(EmbeddedDocumentField(RecurringNote))
    inactiveNotes = ListField(EmbeddedDocumentField(RecurringNote))

