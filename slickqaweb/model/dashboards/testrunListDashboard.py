__author__ = 'jcorbett'

from mongoengine import *

import datetime

from .types import AllTypes

TestrunListDashboardTypeName = "TestrunListDashboard"


class TestrunFinder(EmbeddedDocument):
    name = StringField(required=True)
    query = StringField(required=True)


class InnerGroup(EmbeddedDocument):
    name = StringField(required=True)
    testruns = ListField(EmbeddedDocumentField(TestrunFinder))


class OuterGroup(EmbeddedDocument):
    name = StringField(required=True)
    groups = ListField(EmbeddedDocumentField(InnerGroup))


class TestrunListDashboard(Document):
    meta = {'collection': 'dashboards'}
    name = StringField(required=True, unique=True)
    lastUpdated = DateTimeField(required=True, default=datetime.datetime.now)
    dashboardType = StringField(required=True, default=TestrunListDashboardTypeName, choices=[TestrunListDashboardTypeName,])
    display = StringField(required=True, default="tall", choices=["tall", "columns"])
    configuration = ListField(EmbeddedDocumentField(OuterGroup))
    staleWarning = IntField()

    dynamic_types = {
        'typeName': StringField()
    }

    def dynamic_fields(self):
        return {
            'typeName': 'TestrunListDashboard'
        }

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the dashboardType"""
        return queryset.filter(dashboardType=TestrunListDashboardTypeName)

AllTypes[TestrunListDashboardTypeName] = TestrunListDashboard
