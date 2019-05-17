__author__ = 'jcorbett'


from mongoengine import *
from .releaseReference import ReleaseReference
from .configurationReference import ConfigurationReference
from .resultReference import ResultReference

class RecurringNote(EmbeddedDocument):
    message = StringField()
    url = StringField()
    release = EmbeddedDocumentField(ReleaseReference)
    environment = EmbeddedDocumentField(ConfigurationReference)
    inactivedBy = EmbeddedDocumentField(ResultReference)
