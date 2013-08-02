__author__ = 'jcorbett'

from slickqaweb.model.serialize import document_to_plain, plain_to_document
import datetime
import mongoengine
from bson import ObjectId

from nose.tools import istest
from slickqawebtest.asserts import *

class EmbeddedType(mongoengine.EmbeddedDocument):
    embedded_id = mongoengine.ObjectIdField()
    embedded_string = mongoengine.StringField()

class ComplicatedType(mongoengine.Document):
    string_type = mongoengine.StringField()
    int_type = mongoengine.IntField()
    float_type = mongoengine.FloatField()
    boolean_type = mongoengine.BooleanField()
    dict_type = mongoengine.DictField()
    date_type = mongoengine.DateTimeField()
    embedded_type = mongoengine.EmbeddedDocumentField(EmbeddedType)
    list_of_embedded_type = mongoengine.ListField(mongoengine.EmbeddedDocumentField(EmbeddedType))


# True and False are both included to avoid possibility of default serialization issues
unchanged = [["foo", mongoengine.StringField()],
             [123.123, mongoengine.FloatField()],
             [321, mongoengine.IntField()],
             [True, mongoengine.BooleanField()],
             [False, mongoengine.BooleanField()],
             [{"foo": "bar"}, mongoengine.DictField()],
             [None, mongoengine.StringField()]]

simple_id = ObjectId()

conversion = [
    [datetime.datetime(2012, 10, 24, 20, 20, 15, 426000), 1351110015426, mongoengine.DateTimeField()],
    [simple_id, str(simple_id), mongoengine.ObjectIdField()],
    [EmbeddedType(embedded_id=simple_id, embedded_string="foo"), {'embedded_id': str(simple_id), 'embedded_string': "foo"}, mongoengine.EmbeddedDocumentField(EmbeddedType)],
    [ComplicatedType(string_type="foo",
                     int_type=321,
                     float_type=123.123,
                     boolean_type=True,
                     dict_type={"foo": "bar"},
                     embedded_type=EmbeddedType(embedded_id=simple_id,
                                                embedded_string="one"),
                     list_of_embedded_type=[EmbeddedType(embedded_id=simple_id,
                                                         embedded_string="two"),
                                            EmbeddedType(embedded_id=simple_id,
                                                         embedded_string="three")]),
     {"string_type": "foo",
      "int_type": 321,
      "float_type": 123.123,
      "boolean_type": True,
      "dict_type": {"foo": "bar"},
      "embedded_type": {"embedded_id": str(simple_id), "embedded_string": "one"},
      "list_of_embedded_type": [{"embedded_id": str(simple_id), "embedded_string": "two"},{"embedded_id": str(simple_id), "embedded_string": "three"}]
     }, ComplicatedType]
]

@istest
def test_serialize_basic_types():
    for test in unchanged:
        yield check_proper_serialization, test[0], test[0]
    for test in conversion:
        yield check_proper_serialization, test[0], test[1]


@istest
def test_simple_list_types():
    for test in unchanged:
        yield check_proper_serialization, [test[0], test[0]], [test[0], test[0]]
    for test in conversion:
        yield check_proper_serialization, [test[0], test[0]], [test[1], test[1]]

@istest
def test_deserialize_basic_types():
    for test in unchanged:
        yield check_proper_deserialization, test[0], test[1], test[0]
    for test in conversion:
        yield check_proper_deserialization, test[1], test[2], test[0]

@istest
def test_deserialize_list_types():
    for test in unchanged:
        yield check_proper_deserialization, [test[0], test[0]], mongoengine.ListField(test[1]), [test[0],test[0]]
    for test in conversion:
        yield check_proper_deserialization, [test[1], test[1]], mongoengine.ListField(test[2]), [test[0],test[0]]


def check_proper_serialization(to_serialize, expected_result):
    assert_equal(document_to_plain(to_serialize), expected_result)

def check_proper_deserialization(to_deserialize, type, expected_result):
    assert_equal(plain_to_document(to_deserialize, type), expected_result)
