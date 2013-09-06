__author__ = 'lhigginson'

from mongoengine import *
from .configurationReference import ConfigurationReference
from .componentReference import ComponentReference
from .projectReference import ProjectReference
from .releaseReference import ReleaseReference
from .buildReference import BuildReference
from .step import Step


class Testrun(Document):
    testplanId = ObjectId
    name = StringField()
    config = EmbeddedDocumentField(ConfigurationReference)
    runtimeOptions = EmbeddedDocumentField(ConfigurationReference)
    project = EmbeddedDocumentField(ProjectReference)
    dateCreated = DateTimeField()
    runStarted = DateTimeField()
    runFinished = DateTimeField()
    release = EmbeddedDocumentField(ReleaseReference)
    build = EmbeddedDocumentField(BuildReference)
    # TODO need to add: summary = EmbeddedDocumentField(TestRunSummary)
    # TODO decide how to represent RunStatus enum: state = RunStatus


