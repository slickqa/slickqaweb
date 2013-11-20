__author__ = 'jcorbett'

from mongoengine import *
from .projectReference import ProjectReference
from .testcaseReference import TestcaseReference
from .testrunReference import TestrunReference
from .configurationReference import ConfigurationReference
from .configurationOverride import ConfigurationOverride
from .componentReference import ComponentReference
from .releaseReference import ReleaseReference
from .buildReference import BuildReference
from .resultReference import ResultReference
from .storedFile import StoredFile
from .logEntry import LogEntry

class Result(Document):
    testrun = EmbeddedDocumentField(TestrunReference)
    config = EmbeddedDocumentField(ConfigurationReference)
    configurationOverride = ListField(EmbeddedDocumentField(ConfigurationOverride))
    testcase = EmbeddedDocumentField(TestcaseReference)
    recorded = DateTimeField()
    started = DateTimeField()
    finished = DateTimeField()
    status = StringField()
    runstatus = StringField()
    reason = StringField()
    attributes = MapField(StringField())
    files = ListField(ReferenceField(StoredFile, dbref=True))
    log = ListField(EmbeddedDocumentField(LogEntry))
    project = EmbeddedDocumentField(ProjectReference)
    component = EmbeddedDocumentField(ComponentReference)
    release = EmbeddedDocumentField(ReleaseReference)
    build = EmbeddedDocumentField(BuildReference)
    runlength = IntField()
    history = ListField(EmbeddedDocumentField(ResultReference))
    hostname = StringField()
    meta = {'collection': 'results'}
