__author__ = 'jcorbett'

from mongoengine import *
from .serialize import serializable

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

    def dynamic_fields(self):
        return {
            'statusListOrdered': self.statusListOrdered(),
            'total': self.total()
        }

    @serializable
    def statusListOrdered(self):
        retval = []
        for status in ["PASS", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"]:
            if hasattr(self.resultsByStatus, status) and getattr(self.resultsByStatus, status) > 0:
                retval.append(status)
        return retval

    @serializable
    def total(self):
        retval = 0
        for status in ["PASS", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"]:
            if hasattr(self.resultsByStatus, status) and getattr(self.resultsByStatus, status) > 0:
                retval += getattr(self.resultsByStatus, status)
        return retval
