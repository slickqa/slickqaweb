from mongoengine import *
from projectReference import *
from .testrun import Testrun


class TestrunGroup(Document):

    name = StringField()
    created = DateTimeField()
    testruns = ListField(ReferenceField(Testrun))
  