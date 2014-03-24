__author__ = 'jcorbett'

from mongoengine import *

from .types import AllTypes

TestrunListDashboardTypeName = "testrun-list-dashboard"

class TestrunListDashboard(Document):
    meta = {'collection': 'dashboards'}
    name = StringField(required=True, unique=True)
    lastUpdated = DateTimeField(required=True, default=datetime.datetime.now)
    dashboardType = StringField(required=True, default=TestrunListDashboardTypeName, choices=[TestrunListDashboardTypeName,])
    display = StringField(required=True, default="tall", choices=["tall", "columns"])
    configuration = ListField(EmbeddedDocumentField(OuterGroup))

    @queryset_manager
    def objects(doc_cls, queryset):
        """Custom QuerySet Manager that filters based on the dashboardType"""
        return queryset.filter(dashboardType=TestrunListDashboardTypeName)

class OuterGroup(EmbeddedDocument):
    name = StringField(required=True)
    groups = ListField(EmbeddedDocumentField(InnerGroup))

class InnerGroup(EmbeddedDocument):
    name = StringField(required=True)
    testruns = ListField(EmbeddedDocumentField(TestrunFinder))

class TestrunFinder(EmbeddedDocument):
    name = StringField(required=True)
    query = StringField(required=True)

AllTypes[TestrunListDashboardTypeName] = TestrunListDashboard
