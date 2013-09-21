__author__ = 'slambson'

from slickqaweb.app import app
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import buildQueryFromRequest
from flask import request, g
from .standardResponses import JsonResponse

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testcases')
def get_testcases():
    return JsonResponse(Testcase.objects(buildQueryFromRequest()))

@app.route('/api/testcases/<testcase_id>')
def get_testcase_by_id(testcase_id):
    return JsonResponse(Testcase.objects(id=testcase_id).first())


@app.route('/api/testcases', methods=["POST"])
def add_testcase():
    new_tc = deserialize_that(request.get_json(), Testcase())
    if (new_tc.author is None or new_tc.author == "") and g.user is not None:
        new_tc.author = g.user.full_name
    new_tc.save()
    return JsonResponse(new_tc)

@app.route('/api/testcases/<testcase_id>', methods=["PUT"])
def update_testcase(testcase_id):
    orig = Testcase.objects(id=testcase_id).first()
    deserialize_that(request.get_json(), orig)
    orig.save()
    return JsonResponse(orig)
