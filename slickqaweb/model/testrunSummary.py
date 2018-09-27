__author__ = 'jcorbett'

from mongoengine import *
from .serialize import serializable

def summary_to_status(summary):
    if summary:

        if (summary.resultsByStatus.PASS + summary.resultsByStatus.NOT_TESTED) == summary.total():
            return 'PASS'
        elif (summary.resultsByStatus.PASS + summary.resultsByStatus.PASSED_ON_RETRY + summary.resultsByStatus.NOT_TESTED) == summary.total():
            return 'PASSED_ON_RETRY'
        elif summary.resultsByStatus.FAIL:
            return 'FAIL'
        elif summary.resultsByStatus.BROKEN_TEST:
            return 'BROKEN_TEST'
        elif summary.resultsByStatus.NOT_TESTED and not summary.resultsByStatus.SKIPPED:
            return 'NOT_TESTED'
        elif summary.resultsByStatus.SKIPPED:
            return 'SKIPPED'

class ResultsByStatus(EmbeddedDocument):
    PASS = IntField(default=0)
    PASSED_ON_RETRY = IntField(default=0)
    FAIL = IntField(default=0)
    BROKEN_TEST = IntField(default=0)
    NOT_TESTED = IntField(default=0)
    SKIPPED = IntField(default=0)
    NO_RESULT = IntField(default=0)


class TestrunSummary(EmbeddedDocument):
    totalTime = IntField(default=0)
    resultsByStatus = EmbeddedDocumentField(ResultsByStatus, default=ResultsByStatus())

    dynamic_types = {
        'statusListOrdered': ListField(StringField()),
        'total': IntField(),
        'status': StringField(choices=["PASS", "PASSED_ON_RETRY", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"])
    }

    def dynamic_fields(self):
        return {
            'statusListOrdered': self.statusListOrdered(),
            'total': self.total(),
            'status': self.overallStatus()
        }

    @serializable
    def statusListOrdered(self):
        retval = []
        for status in ["PASS", "PASSED_ON_RETRY", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"]:
            if hasattr(self.resultsByStatus, status) and getattr(self.resultsByStatus, status) > 0:
                retval.append(status)
        return retval

    @serializable
    def overallStatus(self):
        if isinstance(self, TestrunSummary):
            return summary_to_status(self)
        else:
            return None

    @serializable
    def total(self):
        retval = 0
        for status in ["PASS", "PASSED_ON_RETRY", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"]:
            if hasattr(self.resultsByStatus, status) and getattr(self.resultsByStatus, status) > 0:
                retval += getattr(self.resultsByStatus, status)
        return retval
