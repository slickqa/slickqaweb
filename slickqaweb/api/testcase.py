__author__ = 'slambson'

from slickqaweb.app import app
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.serialize import deserialize_that
from flask import Response, request
from .standardResponses import JsonResponse
import datetime

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testcases')
def get_testcases():
    return JsonResponse(Testcase.objects)

@app.route('/api/testcases/<testcase_id>')
def get_testcase_by_id(testcase_id):
    return JsonResponse(Testcase.objects(id=testcase_id).first())


# @app.route('/api/projects', methods=["POST"])
# def add_project():
#     new_project = deserialize_that(request.get_json(), Project())
#     new_project.lastUpdated = datetime.datetime.utcnow()
#     new_project.save()
#     return JsonResponse(new_project)
#
#
# @app.route('/api/projects/<project_name>', methods=["PUT"])
# def update_project(project_name):
#     orig = Project.objects(name=project_name).first()
#     deserialize_that(request.get_json(), orig)
#     orig.lastUpdated = datetime.datetime.utcnow()
#     orig.save()
#     return JsonResponse(orig)
