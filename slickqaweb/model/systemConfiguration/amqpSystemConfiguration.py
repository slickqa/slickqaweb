__author__ = 'jcorbett'


from mongoengine import *

from .types import AllTypes

AMQPSystemConfigurationType = "amqp-system-configuration"

# this is the default class name, kept for compatibility reasons
AMQPSystemConfigurationClassName = "org.tcrun.slickij.api.data.AMQPSystemConfiguration"

class AMQPSystemConfiguration(Document):
    meta = {'collection': 'system-configurations'}
    name = StringField()
    hostname = StringField()
    port = IntField()
    virtualHost = StringField()
    exchangeName = StringField()
    username = StringField()
    password = StringField()
    configurationType = StringField(required=True, default=AMQPSystemConfigurationType, choices=[AMQPSystemConfigurationType,])
    className = StringField(required=True, default=AMQPSystemConfigurationClassName, choices=[AMQPSystemConfigurationClassName,])

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the configurationType"""
        return queryset.filter(configurationType=AMQPSystemConfigurationType)


AllTypes[AMQPSystemConfigurationType] = AMQPSystemConfiguration
