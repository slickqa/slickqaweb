from mongoengine import *
from .testrun import Testrun
from .serialize import serializable


class TestrunGroup(Document):
    name = StringField()
    created = DateTimeField()
    testruns = ListField(ReferenceField(Testrun, dbref=True))
    grouptype = StringField(default="PARALLEL", choices=["SERIAL", "PARALLEL"])
    meta = {'collection': 'testrungroups'}

    @serializable
    def state(self):
        """The state of the testrun group is the "lowest" state of all it's testruns."""
        retval = "FINISHED"
        for testrun in self.testruns:
            assert isinstance(testrun, Testrun)
            if testrun.state == "TO_BE_RUN":
                return "TO_BE_RUN" # lowest possible state, return immediately
            elif testrun.state == "RUNNING":
                retval = "RUNNING" # we don't have to worry about overwriting lower state TO_BE_RUN
        return retval
