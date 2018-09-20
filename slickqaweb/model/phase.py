import datetime

from slickqaweb.model.link import Link
from slickqaweb.model.serialize import serialize_this, serializable

__author__ = 'sjensen'

from mongoengine import *


class Phase(EmbeddedDocument):
    name = StringField()
    state = StringField(choices=["TO_BE_RUN", "RUNNING", "FINISHED"], default="TO_BE_RUN")
    status = StringField(choices=["PASS", "PASSED_ON_RETRY", "FAIL", "BROKEN_TEST", "NOT_TESTED", "SKIPPED", "NO_RESULT"], default="NO_RESULT")
    type = StringField(choices=["unit", "build", "smoke", "bats", "integration", "performance", "regression", "deploy", "generic"], default="generic")
    notes = StringField()
    links = ListField(EmbeddedDocumentField(Link))
    started = DateTimeField()
    finished = DateTimeField()

    dynamic_types = {
        'duration': IntField()
    }

    def dynamic_fields(self):
        return {
            'duration': self.duration()
        }

    @serializable
    def duration(self):
        retval = 0
        if self.started and self.finished:
            retval = serialize_this(self.finished) - serialize_this(self.started)
        elif self.started:
            retval = serialize_this(datetime.datetime.utcnow()) - serialize_this(self.started)
        return retval
