from mongoengine import *
from storedFile import StoredFile

class Feature(EmbeddedDocument):
    id = ObjectIdField()
    name = StringField()
    description = StringField()
    img = ReferenceField(StoredFile, dbref=True)
    imgUrl = StringField()
