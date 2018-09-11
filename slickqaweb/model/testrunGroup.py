from mongoengine import *
from .testrun import Testrun
from .testrunSummary import TestrunSummary, ResultsByStatus
from .serialize import serializable
import bson

def summary_to_status(summary):
    if summary:
        if (summary.resultsByStatus.PASS + summary.resultsByStatus.NOT_TESTED) == summary.total:
            return 'PASS'
        elif (summary.resultsByStatus.PASS + summary.resultsByStatus.PASSED_ON_RETRY + summary.resultsByStatus.NOT_TESTED) == summary.total:
            return 'PASSED_ON_RETRY'
        elif summary.resultsByStatus.FAIL:
            return 'FAIL'
        elif summary.resultsByStatus.BROKEN_TEST:
            return 'BROKEN_TEST'
        elif summary.resultsByStatus.NOT_TESTED and not summary.resultsByStatus.SKIPPED:
            return 'NOT_TESTED'
        elif summary.resultsByStatus.SKIPPED:
            return 'SKIPPED'

class TestrunGroup(Document):
    name = StringField()
    created = DateTimeField()
    testruns = ListField(ReferenceField(Testrun, dbref=True))
    grouptype = StringField(default="PARALLEL", choices=["SERIAL", "PARALLEL"])
    meta = {'collection': 'testrungroups'}

    dynamic_types = {
        'state': StringField(choices=["TO_BE_RUN", "RUNNING", "FINISHED"]),
        'groupSummary': EmbeddedDocumentField(TestrunSummary, help_text="A combined summary of all the testruns.")
    }

    def dynamic_fields(self):
        return {
            'state': self.state(),
            'groupSummary': self.groupSummary()
        }

    @serializable
    def state(self):
        """The state of the testrun group is the "lowest" state of all it's testruns."""
        retval = "FINISHED"
        for testrun in self.testruns:
            # we have to check for this because deleting testruns doesn't always delete them out of testrun groups
            if not isinstance(testrun, bson.DBRef):
                assert isinstance(testrun, Testrun)
                if testrun.state == "TO_BE_RUN":
                    return "TO_BE_RUN" # lowest possible state, return immediately
                elif testrun.state == "RUNNING":
                    retval = "RUNNING" # we don't have to worry about overwriting lower state TO_BE_RUN
        return retval

    @serializable
    def groupSummary(self):
        """Return a summary of all the testruns in the group."""
        retval = TestrunSummary()
        retval.resultsByStatus = ResultsByStatus()
        for run in self.testruns:
            # we have to check for this because deleting testruns doesn't always delete them out of testrun groups
            if not isinstance(run, bson.DBRef):
                for status in run.summary.statusListOrdered():
                    setattr(retval.resultsByStatus, status, getattr(retval.resultsByStatus, status) + getattr(run.summary.resultsByStatus, status))
        retval.status = summary_to_status(retval)
        return retval

