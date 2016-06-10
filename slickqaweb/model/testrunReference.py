__author__ = 'jcorbett'

from mongoengine import *

class TestrunReference(EmbeddedDocument):
    testrunId = ObjectIdField()
    testplanId = ObjectIdField()
    name = StringField()
