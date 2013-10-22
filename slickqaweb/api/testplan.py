__author__ = 'Jared'

from slickqaweb.app import app
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import buildQueryFromRequest
from flask import request, g
from .standardResponses import JsonResponse

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testplan')
def get_testplans():
    return JsonResponse(TestPlan.objects(buildQueryFromRequest()))

@app.route('/api/testplans/<testplan_id>')
def get_testplan_by_id(testplan_id):
    return JsonResponse(TestPlan.objects(id=testplan_id).first())


@app.route('/api/testplans', methods=["POST"])
def add_testplan():
    new_tp = deserialize_that(request.get_json(), TestPlan())
    if (new_tp.createdBy is None or new_tp.createdBy == "") and g.user is not None:
        new_tp.createdBy = g.user.full_name
    new_tc.save()
    return JsonResponse(new_tc)

@app.route('/api/testplans/<testplan_id>', methods=["PUT"])
def update_testplan(testplan_id):
    orig = TestPlan.objects(id=testplan_id).first()
    deserialize_that(request.get_json(), orig)
    orig.save()
    return JsonResponse(orig)
