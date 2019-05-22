__author__ = 'jcorbett'

import mongoengine
import bson
import datetime
import types
import inspect
import logging

def serializable(func):
    func.__serialize__ = True
    return func

plain_types = ((str,), int, int, float, float, type(None))
document_types = (mongoengine.EmbeddedDocument, mongoengine.Document)
epoch = datetime.datetime(1970, 1, 1)
def document_to_plain(doc):
    if isinstance(doc, plain_types):
        return doc
    if isinstance(doc, document_types):
        retval = dict()
        for fieldname in list(doc._fields.keys()):
            value = getattr(doc, fieldname)
            if value is not None:
                retval[fieldname] = document_to_plain(value)
        if hasattr(doc, 'dynamic_fields'):
            for key, value in list(doc.dynamic_fields().items()):
                retval[key] = document_to_plain(value)
        return retval
    if isinstance(doc, dict):
        retval = dict()
        for fieldname, fieldvalue in doc.items():
            retval[fieldname] = document_to_plain(fieldvalue)
        return retval
    if isinstance(doc, bson.ObjectId):
        return str(doc)
    if isinstance(doc, list):
        retval = []
        for item in doc:
            plain_item = document_to_plain(item)
            if plain_item is not None:
                retval.append(plain_item)
        return retval
    if isinstance(doc, datetime.datetime):
        return int((doc - epoch).total_seconds() * 1000)
    if isinstance(doc, mongoengine.QuerySet):
        return [document_to_plain(item) for item in doc]
    if isinstance(doc, bson.DBRef):
        return None
    raise Exception("I don't know how to serialize %s: looks like %s" % (doc.__class__.__name__, repr(doc)))

logger = logging.getLogger('slickqaweb.model.serialize')

def plain_to_document(plain, doctype):
    if isinstance(plain, dict):
        if isinstance(doctype, (mongoengine.Document, mongoengine.EmbeddedDocument)):
            retval = doctype
            for fieldname in list(retval._fields.keys()):
                if fieldname in plain:
                    if isinstance(retval._fields[fieldname], (mongoengine.EmbeddedDocumentField, mongoengine.ReferenceField)):
                        if getattr(retval, fieldname) is None:
                            setattr(retval, fieldname, retval._fields[fieldname].document_type())
                        setattr(retval, fieldname, plain_to_document(plain[fieldname], getattr(retval, fieldname)))
                    else:
                        setattr(retval, fieldname, plain_to_document(plain[fieldname], retval._fields[fieldname]))
            return retval
        if isinstance(doctype, mongoengine.EmbeddedDocumentField):
            return plain_to_document(plain, doctype.document_type())
        if isinstance(doctype, mongoengine.DictField):
            return plain
        if isinstance(doctype, mongoengine.ReferenceField):
            return plain_to_document(plain, doctype.document_type())
    if isinstance(plain, (str,)) or isinstance(plain, str):
        if isinstance(doctype, mongoengine.StringField):
            return plain
        if isinstance(doctype, mongoengine.ObjectIdField):
            return bson.ObjectId(plain)
        if isinstance(doctype, mongoengine.DateTimeField):
            try:
                return datetime.datetime.utcfromtimestamp(float(plain) / 1000)
            except:
                pass
            try:
                return datetime.datetime.strptime(plain, "%a, %d %b %Y %H:%M:%S %Z")
            except:
                pass
            try:
                date_to_parse = plain
                if plain.endswith('Z'):
                    date_to_parse = plain[:-2]
                return datetime.datetime.strptime(date_to_parse, "%Y:%m:%dT%H:%M:%S.%f")
            except:
                pass
            try:
                date_to_parse = plain
                if plain.endswith('Z'):
                    date_to_parse = plain[:-2]
                return datetime.datetime.strptime(date_to_parse, "%Y-%m-%dT%H:%M:%S.%f")
            except:
                pass
    if isinstance(plain, int):
        if isinstance(doctype, (mongoengine.IntField, mongoengine.LongField)):
            return plain
        if isinstance(doctype, mongoengine.DateTimeField):
            return datetime.datetime.utcfromtimestamp(float(plain) / 1000)
    if isinstance(plain, float):
        if isinstance(doctype, mongoengine.FloatField):
            return plain
    if isinstance(plain, list):
        if isinstance(doctype, mongoengine.ListField):
            return [plain_to_document(item, doctype.field) for item in plain]
    if isinstance(plain, bool):
        if isinstance(doctype, mongoengine.BooleanField):
            return plain
    if isinstance(plain, type(None)):
        return plain
    logger.warn("I don't know what to do with %s and doctype %s", repr(plain), repr(doctype))


# Better names
serialize_this = document_to_plain
deserialize_that = plain_to_document

