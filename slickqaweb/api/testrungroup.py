__author__ = 'Jared Jorgensen'

from slickqaweb.app import app
from slickqaweb.model.TestrunGroup import TestrunGroup
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import buildQueryFromRequest
from flask import request, g
from .standardResponses import JsonResponse

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testrungroup')
def get_testrungroups():
    return JsonResponse(TestrunGroup.objects(buildQueryFromRequest()))

@app.route('/api/testrungroup/<testrungroup_id>')
def get_testrungroup_by_id(testrungroup_id):
    return JsonResponse(TestPlan.objects(id=testrungroup_id).first())


@app.route('/api/testrungroup', methods=["POST"])
def add_testrungroup():
    new_trg = deserialize_that(request.get_json(), TestrunGroup())
    if (new_trg.createdBy is None or new_trg.createdBy == "") and g.user is not None:
        new_trg.createdBy = g.user.full_name
    new_trg.save()
    return JsonResponse(new_trg)

@app.route('/api/testrungroup/<testrungroup_id>', methods=["PUT"])
def update_testrungroup(testrungroup_id):
    orig = TestrunGroup.objects(id=testrungroup_id).first()
    deserialize_that(request.get_json(), orig)
    orig.save()
    return JsonResponse(orig)

@app.route('/api/testrungroup/<testrungroup_id>', methods=["DELETE"])
def delete_testrungroup(testrungroup_id):
    orig = TestrunGroup.objects(id=testrungroup_id).first()
    orig.delete()
    return JsonResponse(orig)