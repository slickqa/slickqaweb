__author__ = 'jcorbett'

from mongoengine import *

class ResultsByStatus(EmbeddedDocument):
    PASS = IntField(default=0)
    FAIL = IntField(default=0)
    BROKEN_TEST = IntField(default=0)
    NOT_TESTED = IntField(default=0)
    SKIPPED = IntField(default=0)
    NO_RESULT = IntField(default=0)


class TestrunSummary(EmbeddedDocument):
    totalTime = IntField(default=0)
    resultsByStatus = EmbeddedDocumentField(ResultsByStatus, default=ResultsByStatus())
