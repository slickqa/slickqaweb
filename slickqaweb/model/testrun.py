__author__ = 'lhigginson'

from mongoengine import *
from .configurationReference import ConfigurationReference
from .componentReference import ComponentReference
from .projectReference import ProjectReference
from .releaseReference import ReleaseReference
from .buildReference import BuildReference
from .step import Step
from .testrunSummary import TestrunSummary
from .serialize import serializable
from .testPlan import TestPlan
from .storedFile import StoredFile


class Testrun(Document):
    testplanId = ObjectIdField()
    name = StringField()
    info = StringField()
    config = EmbeddedDocumentField(ConfigurationReference)
    runtimeOptions = EmbeddedDocumentField(ConfigurationReference)
    project = EmbeddedDocumentField(ProjectReference)
    dateCreated = DateTimeField()
    runStarted = DateTimeField()
    runFinished = DateTimeField()
    release = EmbeddedDocumentField(ReleaseReference)
    build = EmbeddedDocumentField(BuildReference)
    summary = EmbeddedDocumentField(TestrunSummary, default=TestrunSummary())
    files = ListField(ReferenceField(StoredFile, dbref=True))
    state = StringField()
    meta = {'collection': 'testruns'}

    def dynamic_fields(self):
        if self.testplanId is None:
            return dict()
        else:
            return {
                'testplan': self.testplan()
            }

    @serializable
    def testplan(self):
        if self.testplanId is not None:
            return TestPlan.objects(id=self.testplanId).first()


