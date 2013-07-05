from .configuration import Configuration
from .component import Component
from .dataDrivenProperty import DataDrivenProperty
from .release import Release
from mongoengine import *


class Project(Document):
    attributes = StringField()
    automationTools = ListField(StringField())
    components = ListField(EmbeddedDocumentField(Component))
    configuration = ReferenceField(Configuration)
    dataDrivenProperties = ListField(EmbeddedDocumentField(DataDrivenProperty))
    defaultRelease = StringField()
    description = StringField()
    lastUpdated = DateTimeField()
    name = StringField(required=True)
    releases = ListField(EmbeddedDocumentField(Release))
    tags = ListField(StringField())
    meta = {'collection': 'projects'}