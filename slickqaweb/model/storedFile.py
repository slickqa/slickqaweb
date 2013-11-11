__author__ = 'jcorbett'

from mongoengine import *

class StoredFile(Document):
    meta = {'collection': 'fs.files'}
    filename = StringField()
    chunkSize = IntField()
    uploadDate = DateTimeField()
    mimetype = StringField()
    md5 = StringField()
    length = LongField()

