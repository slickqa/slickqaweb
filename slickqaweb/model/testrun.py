import datetime

from slickqaweb.model.link import Link

__author__ = 'lhigginson'

from mongoengine import *
from .configurationReference import ConfigurationReference
from .projectReference import ProjectReference
from .releaseReference import ReleaseReference
from .buildReference import BuildReference
from .testrunSummary import TestrunSummary
from .serialize import serializable, serialize_this
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
    links = ListField(EmbeddedDocumentField(Link))
    state = StringField()
    attributes = MapField(StringField())
    meta = {'collection': 'testruns'}

    dynamic_types = {
        'testplan': ReferenceField(TestPlan),
        'duration': IntField()
    }

    def dynamic_fields(self):
        dict = {'duration': self.duration()}
        if self.testplanId is None:
            return dict
        else:
            dict['testplan'] = self.testplan()
            return dict

    @serializable
    def testplan(self):
        if self.testplanId is not None:
            return TestPlan.objects(id=self.testplanId).first()

    @serializable
    def duration(self):
        retval = 0
        if self.runStarted and self.runFinished:
            retval = serialize_this(self.runFinished) - serialize_this(self.runStarted)
        elif self.runStarted:
            retval = serialize_this(datetime.datetime.utcnow()) - serialize_this(self.runStarted)
        return retval
