import datetime

from slickqaweb.utils import is_provided, is_not_provided

__author__ = 'slambson'

from slickqaweb.app import app
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request
from .standardResponses import JsonResponse, read_request
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField, connection

add_resource('/testcases', 'Add, update, and delete testcases.')

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testcases')
@standard_query_parameters
@returns(ListField(ReferenceField(Testcase)))
def get_testcases():
    """Query for testcases."""
    args = request.args
    if args.has_key('projectid'):
        args = args.to_dict()
        args['project.id'] = request.args['projectid']
        del args['projectid']
    return JsonResponse(queryFor(Testcase, args))

@app.route('/api/testcases/<testcase_id>')
@returns(Testcase)
@argument_doc('testcase_id', 'The id of the testcase you are trying to access (string representation of BSON ObjectId).')
def get_testcase_by_id(testcase_id):
    """Retrieve a testcase by it's id."""
    return JsonResponse(Testcase.objects(id=testcase_id).first())

@app.route('/api/testcases/recently-created')
def get_testcases_created():
    # Default is by build
    query = {'project': '$project.name'}
    days = 1
    if 'days' in request.args:
        days = int(request.args['days'])
    conn = connection.get_connection()
    result = conn[app.config['MONGODB_DBNAME']]['testcases'].aggregate([
        {'$match': {'created': {'$gte': datetime.datetime.utcnow() + datetime.timedelta(-days), '$lt': datetime.datetime.utcnow()}}},
        {'$group': {'_id': query, 'count': {'$sum': 1}}}
    ])
    return JsonResponse(list(result))


@app.route('/api/testcases', methods=["POST"])
@note("If a user is logged in and no author is provided, the the author field will be filled in automatically.")
@accepts(Testcase)
@returns(Testcase)
def add_testcase():
    """Add a new testcase."""
    new_tc = deserialize_that(read_request(), Testcase())
    #if (new_tc.author is None or new_tc.author == "") and g.user is not None:
    #    new_tc.author = g.user.full_name
    if is_not_provided(new_tc, 'created'):
        new_tc.created = datetime.datetime.utcnow()
    new_tc.save()
    return JsonResponse(new_tc)

@app.route('/api/testcases/<testcase_id>', methods=["PUT"])
@argument_doc('testcase_id', 'The id of the testcase you are trying to access (string representation of BSON ObjectId).')
@note("When submitting updates, you only need to provide the properties that have changed.")
@accepts(Testcase)
@returns(Testcase)
def update_testcase(testcase_id):
    """Update the properties of a testcase."""
    orig = Testcase.objects(id=testcase_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)

