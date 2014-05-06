__author__ = 'jcorbett'


from mongoengine import *

from .types import AllTypes

EmailSystemConfigurationType = "email-system-configuration"

# this is the default class name, kept for compatibility reasons
EmailSystemConfigurationClassName = "org.tcrun.slickij.api.data.EmailSystemConfiguration"

class EmailSystemConfiguration(Document):
    meta = {'collection': 'system-configurations'}
    name = StringField()
    smtpHostname = StringField()
    smtpPort = IntField()
    smtpUsername = StringField()
    smtpPassword = StringField()
    ssl = BooleanField()
    enabled = BooleanField()
    sender = StringField()
    configurationType = StringField(required=True, default=EmailSystemConfigurationType, choices=[EmailSystemConfigurationType,])
    className = StringField(required=True, default=EmailSystemConfigurationClassName, choices=[EmailSystemConfigurationClassName,])

    dynamic_types = {
        'typeName': StringField()
    }

    def dynamic_fields(self):
        return {
            'typeName': 'EmailSystemConfiguration'
        }

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the configurationType"""
        return queryset.filter(configurationType=EmailSystemConfigurationType)


AllTypes[EmailSystemConfigurationType] = EmailSystemConfiguration
