__author__ = 'jcorbett'

import mongoengine
import bson
import datetime
import types


def document_to_plain(doc):
    if isinstance(doc, mongoengine.QuerySet):
        return [document_to_plain(item) for item in doc]
    if isinstance(doc, mongoengine.Document) or isinstance(doc, mongoengine.EmbeddedDocument):
        retval = dict()
        for fieldname in doc._fields.keys():
            value = getattr(doc, fieldname)
            if value is not None:
                retval[fieldname] = document_to_plain(value)
        return retval
    if isinstance(doc, types.ListType):
        return [document_to_plain(item) for item in doc]
    if isinstance(doc, (types.StringTypes, types.IntType, types.FloatType, types.FloatType, types.DictionaryType, types.NoneType)):
        return doc
    if isinstance(doc, datetime.datetime):
        return int((doc - datetime.datetime(1970, 1, 1)).total_seconds() * 1000)
    if isinstance(doc, bson.ObjectId):
        return str(doc)
    print "I don't know how to serialize %s" % doc.__class__.__name__


def plain_to_document(plain, doctype):
    if isinstance(plain, types.DictionaryType):
        if isinstance(doctype, types.TypeType) and issubclass(doctype, mongoengine.Document):
            retval = doctype()
            for fieldname in retval._fields.keys():
                if fieldname in plain:
                    setattr(retval, fieldname, plain_to_document(plain[fieldname], retval._fields[fieldname]))
            return retval
        if isinstance(doctype, (mongoengine.EmbeddedDocumentField, mongoengine.ReferenceField)):
            retval = doctype.document_type()
            for fieldname in retval._fields.keys():
                if fieldname in plain:
                    setattr(retval, fieldname, plain_to_document(plain[fieldname], retval._fields[fieldname]))
            return retval
        if isinstance(doctype, mongoengine.DictField):
            return plain
    if isinstance(plain, types.StringTypes):
        if isinstance(doctype, mongoengine.StringField):
            return plain
        if isinstance(doctype, mongoengine.ObjectIdField):
            return bson.ObjectId(plain)
    if isinstance(plain, types.IntType):
        if isinstance(doctype, (mongoengine.IntField, mongoengine.LongField)):
            return plain
        if isinstance(doctype, mongoengine.DateTimeField):
            return datetime.datetime.utcfromtimestamp(float(plain) / 1000)
    if isinstance(plain, types.FloatType):
        if isinstance(doctype, mongoengine.FloatField):
            return plain
    if isinstance(plain, types.ListType):
        if isinstance(doctype, mongoengine.ListField):
            return [plain_to_document(item, doctype.field) for item in plain]
    if isinstance(plain, types.BooleanType):
        if isinstance(doctype, mongoengine.BooleanField):
            return plain
    if isinstance(plain, types.NoneType):
        return plain
    print "I don't know what to do with %s" % repr(plain)


# Better names
serialize_this = document_to_plain
deserialize_this = plain_to_document

