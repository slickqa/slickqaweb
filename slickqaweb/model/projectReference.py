__author__ = 'jcorbett'

from mongoengine import *

class ProjectReference(EmbeddedDocument):
    id = ObjectIdField()
    name = StringField()


