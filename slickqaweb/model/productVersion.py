__author__ = 'jcorbett'

from mongoengine import *

class ProductVersion(Document):
    productName = StringField()
    versionString = StringField()
