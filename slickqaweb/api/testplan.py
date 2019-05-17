__author__ = 'Jared'

from slickqaweb.app import app
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request
from .standardResponses import JsonResponse, read_request
from .apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField

add_resource('/testplans', 'Add, update, and delete testplans.')


@app.route('/api/testplans')
@standard_query_parameters
@returns(ListField(ReferenceField(TestPlan)))
def get_testplans():
    """Query for existing testplans."""
    # for backwards compatibility
    args = request.args
    if 'projectid' in args:
        args = args.to_dict()
        args['project.id'] = request.args['projectid']
        del args['projectid']
    return JsonResponse(queryFor(TestPlan, args))

@app.route('/api/testplans/<testplan_id>')
@argument_doc('testplan_id', 'The id of the testplan (string representation of BSON ObjectId).')
def get_testplan_by_id(testplan_id):
    """Get a specific testplan by it's id."""
    return JsonResponse(TestPlan.objects(id=testplan_id).first())


@app.route('/api/testplans', methods=["POST"])
@accepts(TestPlan)
@returns(TestPlan)
def add_testplan():
    """Add a new testplan."""
    new_tp = deserialize_that(read_request(), TestPlan())
    #if (new_tp.createdBy is None or new_tp.createdBy == "") and g.user is not None:
    #    new_tp.createdBy = g.user.full_name
    new_tp.save()
    return JsonResponse(new_tp)

@app.route('/api/testplans/<testplan_id>', methods=["PUT"])
@accepts(TestPlan)
@returns(TestPlan)
@argument_doc('testplan_id', 'The id of the testplan (string representation of BSON ObjectId).')
@note("You only need to specify the properties that need updating.")
def update_testplan(testplan_id):
    """Update an existing testplan's properties."""
    orig = TestPlan.objects(id=testplan_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)

