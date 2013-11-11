__author__ = 'jcorbett'

from mongoengine import *

class TestcaseReference(EmbeddedDocument):
    testcaseId = ObjectIdField()
    name = StringField()
    automationId = StringField()
    automationKey = StringField()
    automationTool = StringField()
