__author__ = 'jcorbett'

from .standardResponses import JsonResponse
from slickqaweb.model.query import buildQueryFromRequest
from slickqaweb.app import app
from slickqaweb.model.result import Result
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.resultReference import ResultReference
from slickqaweb.model.logEntry import LogEntry
from slickqaweb.model.dereference import find_testcase_by_reference, find_project_by_reference
from slickqaweb.model.reference import create_project_reference, create_testcase_reference
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference


import types
import datetime
from mongoengine import Q
from flask import request, Response


@app.route('/api/results')
def get_results():
    args = request.args.to_dict()
    query = None
    all_fields = False
    if args.has_key('testrunid'):
        args['testrun.testrunId'] = request.args['testrunid']
        del args['testrunid']
    if args.has_key('status') and args.has_key('excludestatus'):
        print "Oh crap, got status and excludestatus"
        del args['excludestatus']
    if args.has_key('allfields'):
        all_fields = True
        del args['allfields']
    if args.has_key('excludestatus'):
        exclude = args['excludestatus']
        del args['excludestatus']
        query = buildQueryFromRequest(args)
        query = (query & Q(status__ne=exclude))
    else:
        query = buildQueryFromRequest(args)

    if all_fields:
        return JsonResponse(Result.objects(query).order_by('-recorded'))
    else:
        return JsonResponse(Result.objects(query).order_by('-recorded').exclude("log", "build", "release", "project", "testrun", "config"))


@app.route('/api/results/<result_id>')
def get_result_by_id(result_id):
    return JsonResponse(Result.objects(id=result_id).first())


def is_not_provided(obj, attr_name):
    if not hasattr(obj, attr_name):
        return True
    if getattr(obj, attr_name) is None:
        return True
    if isinstance(getattr(obj, attr_name), types.StringTypes) and getattr(obj, attr_name) == '':
        return True
    return False

@app.route('/api/results', methods=["POST"])
def add_result():
    new_tr = deserialize_that(request.get_json(), Result())
    assert isinstance(new_tr, Result)
    # validate --------------------------------------------------------------
    errors = []
    if is_not_provided(new_tr, 'status'):
        errors.append("status must be set")
    if is_not_provided(new_tr, 'testcase') or (is_not_provided(new_tr.testcase, 'name') and
                                               is_not_provided(new_tr.testcase, 'testcaseId') and
                                               is_not_provided(new_tr.testcase, 'automationId') and
                                               is_not_provided(new_tr.testcase, 'automationKey')):
        errors.append("testcase must be provided with at least one identifying piece of data")
    if len(errors) > 0:
        return Response('\r\n'.join(errors), status=400, mimetype="text/plain")
    # fill in defaults -------------------------------------------------------
    if is_not_provided(new_tr, 'runstatus'):
        if new_tr.status == "NO_RESULT":
            new_tr.runstatus = "TO_BE_RUN"
        else:
            new_tr.runstatus = "FINISHED"
    if is_not_provided(new_tr, 'recorded'):
        new_tr.recorded = datetime.datetime.now()
    # resolve references -----------------------------------------------------
    project = None
    if not is_not_provided(new_tr, 'project'):
        project = find_project_by_reference(project)
        if project is None and not is_not_provided(new_tr.project, 'name'):
            project = Project()
            project.name = new_tr.project.name
            project.save()
    if project is not None:
        new_tr.project = create_project_reference(project)
    testcase = find_testcase_by_reference(new_tr.testcase)



    new_tr.save()
    return JsonResponse(new_tr)

@app.route('/api/results/<result_id>', methods=["PUT"])
def update_result(result_id):
    orig = Result.objects(id=result_id).first()
    deserialize_that(request.get_json(), orig)
    orig.save()
    return JsonResponse(orig)

@app.route('/api/results/<result_id>/log', methods=["POST"])
def add_to_log(result_id):
    orig = Result.objects(id=result_id).first()
    list_of_log_entries = request.get_json()
    if not hasattr(orig, 'log') or orig.log is None:
        orig.log = []
    for entry_json in list_of_log_entries:
        orig.log.append(deserialize_that(entry_json, LogEntry()))
    return JsonResponse(len(orig.log))


