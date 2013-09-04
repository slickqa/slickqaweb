__author__ = 'jcorbett'

from mongoengine import *

class Step(EmbeddedDocument):
    name = StringField()
    expectedResult = StringField()
