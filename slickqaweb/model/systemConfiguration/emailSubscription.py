__author__ = 'jcorbett'


from mongoengine import *

from .types import AllTypes
from .subscriptionInfo import SubscriptionInfo

EmailSubscriptionSystemConfigurationType = "email-subscription"

# this is the default class name, kept for compatibility reasons
EmailSubscriptionSystemConfigurationClassName = "org.tcrun.slickij.api.data.EmailSubscription"

class EmailSubscriptionSystemConfiguration(Document):
    meta = {'collection': 'system-configurations'}
    name = StringField()
    subscriptions = ListField(EmbeddedDocumentField(SubscriptionInfo))
    enabled = BooleanField()
    globalSubscription = BooleanField()
    configurationType = StringField(required=True, default=EmailSubscriptionSystemConfigurationType, choices=[EmailSubscriptionSystemConfigurationType,])
    className = StringField(required=True, default=EmailSubscriptionSystemConfigurationClassName, choices=[EmailSubscriptionSystemConfigurationClassName,])

    dynamic_types = {
        'typeName': StringField()
    }

    def dynamic_fields(self):
        return {
            'typeName': 'EmailSubscriptionSystemConfiguration'
        }

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the configurationType"""
        return queryset.filter(configurationType=EmailSubscriptionSystemConfigurationType)


AllTypes[EmailSubscriptionSystemConfigurationType] = EmailSubscriptionSystemConfiguration
