__author__ = 'jcorbett'


from mongoengine import *
from .releaseReference import ReleaseReference
from .configurationReference import ConfigurationReference

class RecurringNote(EmbeddedDocument):
    message = StringField()
    url = StringField()
    release = EmbeddedDocumentField(ReleaseReference)
    environment = EmbeddedDocumentField(ConfigurationReference)
