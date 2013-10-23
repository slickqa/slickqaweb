from mongoengine import *
from projectReference import *


class TestPlan(Document):

    name = StringField()
    createdBy = StringField()
    project = EmbeddedDocumentField(ProjectReference)
    sharedWith = ListField(StringField())
    isprivate = BooleanField()
    #queries = ListField()
    meta = {'collection': 'testplans'}
