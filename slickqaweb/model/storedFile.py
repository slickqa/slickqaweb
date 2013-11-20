__author__ = 'jcorbett'

from mongoengine import *

class StoredFile(Document):
    meta = {'collection': 'fs.files'}
    filename = StringField(required=True)
    chunkSize = IntField()
    uploadDate = DateTimeField()
    mimetype = StringField(required=True)
    md5 = StringField()
    length = LongField()

