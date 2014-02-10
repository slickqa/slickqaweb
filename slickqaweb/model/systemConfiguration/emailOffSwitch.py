__author__ = 'jcorbett'


from mongoengine import *

from .types import AllTypes

EmailOffSwitchSystemConfigurationType = "email-off-switch"

# this is the default class name, kept for compatibility reasons
EmailOffSwitchSystemConfigurationClassName = "org.tcrun.slickij.api.data.EmailOffSwitch"

class EmailOffSwitchSystemConfiguration(Document):
    meta = {'collection': 'system-configurations'}
    name = StringField()
    turnOffEmailsForType = StringField()
    turnOffEmailsForId = StringField()
    configurationType = StringField(required=True, default=EmailOffSwitchSystemConfigurationType, choices=[EmailOffSwitchSystemConfigurationType,])
    className = StringField(required=True, default=EmailOffSwitchSystemConfigurationClassName, choices=[EmailOffSwitchSystemConfigurationClassName,])

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the configurationType"""
        return queryset.filter(configurationType=EmailOffSwitchSystemConfigurationType)


AllTypes[EmailOffSwitchSystemConfigurationType] = EmailOffSwitchSystemConfiguration
