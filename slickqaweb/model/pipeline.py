import datetime

from slickqaweb.model.phase import Phase
from slickqaweb.model.serialize import serializable, serialize_this, deserialize_that

__author__ = 'sjensen'

from mongoengine import *
from .projectReference import ProjectReference
from .releaseReference import ReleaseReference
from .buildReference import BuildReference


class Pipeline(Document):
    name = StringField()
    project = EmbeddedDocumentField(ProjectReference)
    release = EmbeddedDocumentField(ReleaseReference)
    build = EmbeddedDocumentField(BuildReference)
    phases = ListField(EmbeddedDocumentField(Phase))
    notes = StringField()
    started = DateTimeField()
    finished = DateTimeField()

    dynamic_types = {
        'duration': IntField(),
        'status': StringField(choices=["PASS", "PASSED_ON_RETRY", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"], default="NO_RESULT"),
        'state': StringField(choices=["TO_BE_RUN", "RUNNING", "FINISHED"], default="RUNNING")
    }

    def dynamic_fields(self):
        return {
            'duration': self.duration(),
            'status': self.status(),
            'state': self.state()
        }

    @serializable
    def duration(self):
        retval = 0
        if self.started and self.finished:
            retval = serialize_this(self.finished) - serialize_this(self.started)
        elif self.started:
            retval = serialize_this(datetime.datetime.utcnow()) - serialize_this(self.started)
        return retval

    @serializable
    def status(self):
        """The state of the testrun group is the "lowest" state of all it's testruns."""
        phase_statuses = []
        phase_states = []
        for phase in self.phases:
            phase_statuses.append(phase.status)
            phase_states.append(phase.state)
        if "NO_RESULT" in phase_statuses and "RUNNING" in phase_states:
            return 'NO_RESULT'
        if "FAIL" not in phase_statuses and "BROKEN_TEST" not in phase_statuses and "SKIPPED" not in phase_statuses and "PASSED_ON_RETRY" not in phase_statuses:
            return 'PASS'
        elif "FAIL" not in phase_statuses and "BROKEN_TEST" not in phase_statuses and "SKIPPED" not in phase_statuses and "PASSED_ON_RETRY" in phase_statuses:
            return 'PASSED_ON_RETRY'
        elif "FAIL" in phase_statuses:
            return 'FAIL'
        elif "BROKEN_TEST" in phase_statuses:
            return 'BROKEN_TEST'
        elif "NOT_TESTED" in phase_statuses and "SKIPPED" not in phase_statuses:
            return 'NOT_TESTED'
        elif "SKIPPED" in phase_statuses:
            return 'SKIPPED'

    @serializable
    def state(self):
        """The state of the testrun group is the "lowest" state of all it's testruns."""
        retval = "FINISHED"
        if self.status == "NO_RESULT":
            return "RUNNING"
        if retval == "FINISHED" and not self.finished:
            self.finished = datetime.datetime.utcnow()
            self.save()
        return retval

    meta = {'collection': 'pipelines'}
