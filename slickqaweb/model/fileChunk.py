__author__ = 'jcorbett'

from mongoengine import *

class FileChunk(Document):
    meta = {'collection': 'fs.chunks'}
    files_id = ObjectIdField()
    n = IntField()
    data = BinaryField()
