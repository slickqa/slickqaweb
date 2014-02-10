__author__ = 'jcorbett'


from mongoengine import *

from .types import AllTypes

AutomaticTestrunGroupSystemConfigurationType = "auto-add-to-testrungroup"

class TestrunMatch(EmbeddedDocument):
    propertyName = StringField()
    propertyValue = StringField()


class AutomaticTestrunGroupSystemConfiguration(Document):
    meta = {'collection': 'system-configurations'}
    name = StringField()
    enabled = BooleanField()
    configurationType = StringField(required=True, default=AutomaticTestrunGroupSystemConfigurationType, choices=[AutomaticTestrunGroupSystemConfigurationType,])
    template = StringField()
    matchers = ListField(EmbeddedDocumentField(TestrunMatch))

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the configurationType"""
        return queryset.filter(configurationType=AutomaticTestrunGroupSystemConfigurationType)


AllTypes[AutomaticTestrunGroupSystemConfigurationType] = AutomaticTestrunGroupSystemConfiguration
