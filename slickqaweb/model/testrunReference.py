__author__ = 'jcorbett'

from mongoengine import *

class TestrunReference(EmbeddedDocument):
    testrunId = ObjectIdField()
    name = StringField()
