__author__ = 'Jared'

from slickqaweb.app import app
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request, g
from .standardResponses import JsonResponse, read_request

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testplans')
def get_testplans():
    # for backwards compatibility
    args = request.args
    if args.has_key('projectid'):
        args = args.to_dict()
        args['project.id'] = request.args['projectid']
        del args['projectid']
    return JsonResponse(queryFor(TestPlan, args))

@app.route('/api/testplans/<testplan_id>')
def get_testplan_by_id(testplan_id):
    return JsonResponse(TestPlan.objects(id=testplan_id).first())


@app.route('/api/testplans', methods=["POST"])
def add_testplan():
    new_tp = deserialize_that(read_request(), TestPlan())
    if (new_tp.createdBy is None or new_tp.createdBy == "") and g.user is not None:
        new_tp.createdBy = g.user.full_name
    new_tp.save()
    return JsonResponse(new_tp)

@app.route('/api/testplans/<testplan_id>', methods=["PUT"])
def update_testplan(testplan_id):
    orig = TestPlan.objects(id=testplan_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)
