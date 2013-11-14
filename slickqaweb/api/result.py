__author__ = 'jcorbett'

from .standardResponses import JsonResponse
from slickqaweb.model.query import buildQueryFromRequest
from slickqaweb.app import app
from slickqaweb.model.result import Result
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.resultReference import ResultReference
from slickqaweb.model.logEntry import LogEntry
from slickqaweb.model.dereference import find_testcase_by_reference, find_project_by_reference, find_testrun_by_reference, find_component_by_reference
from slickqaweb.model.reference import create_project_reference, create_testcase_reference, create_component_reference
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.component import Component


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


def is_provided(obj, attr_name):
    return not is_not_provided(obj, attr_name)


@app.route('/api/results', methods=["POST"])
def add_result():
    new_result = deserialize_that(request.get_json(), Result())
    assert isinstance(new_result, Result)
    # validate --------------------------------------------------------------
    # you must have a testcase reference (some info about the testcase) and a
    # status for the result.  Otherwise it's not really a result.
    errors = []
    if is_not_provided(new_result, 'status'):
        errors.append("status must be set")
    if is_not_provided(new_result, 'testcase') or (is_not_provided(new_result.testcase, 'name') and
                                               is_not_provided(new_result.testcase, 'testcaseId') and
                                               is_not_provided(new_result.testcase, 'automationId') and
                                               is_not_provided(new_result.testcase, 'automationKey')):
        errors.append("testcase must be provided with at least one identifying piece of data")
    if len(errors) > 0:
        return Response('\r\n'.join(errors), status=400, mimetype="text/plain")

    # fill in defaults -------------------------------------------------------
    # a few fields can easily be inferred or set to a default

    if is_not_provided(new_result, 'runstatus'):
        if new_result.status == "NO_RESULT":
            new_result.runstatus = "TO_BE_RUN"
        else:
            new_result.runstatus = "FINISHED"
    if is_not_provided(new_result, 'recorded'):
        new_result.recorded = datetime.datetime.now()

    # resolve references -----------------------------------------------------
    testrun = None
    project = None
    testcase = None
    release = None
    build = None
    component = None

    # the order in this section is important.  We try to find information any way we can,
    # so if it's not provided in the result, we look at the testrun, if it's not in the testrun,
    # but it is in the testcase we get it from there.

    # first lookup the testrun and resolve it if we can
    if is_provided(new_result, 'testrun'):
        testrun = find_testrun_by_reference(new_result.testrun)
        # don't create a new testrun if it's null, we'll do that later after we resolve the other
        # pieces of information

    # try to resolve the testcase, we won't try to create it if it's none yet.
    # for that we need to resolve as much of the other information we can.
    testcase = find_testcase_by_reference(new_result.testcase)

    # try to find the project from the data provided in the result.  If that doesn't work,
    # and we do have a testrun, see if we can get it from there.  If we do have a name of a
    # project and we still haven't found the project, create it!
    if is_provided(new_result, 'project'):
        project = find_project_by_reference(project)
        if project is None and testrun is not None and is_provided(testrun, 'project'):
            project = find_project_by_reference(testrun.project)
        if project is None and is_provided(new_result.project, 'name'):
            project = Project()
            project.name = new_result.project.name
            project.save()

    # if they didn't provide any project data, but did provide testrun data, try
    # to resolve the project from the testrun
    if project is None and testrun is not None and is_provided(testrun, 'project'):
        project = find_project_by_reference(testrun.project)

    # if we couldn't resolve the project previously, but we can resolve the testcase
    # see if we can get the project from the testcase
    if project is None and testcase is not None and is_provided(testcase, 'project'):
        project = find_project_by_reference(testcase.project)


    # finally, make sure that the reference we have in the result has all the info in it
    if project is not None:
        new_result.project = create_project_reference(project)

    # resolve the component
    if is_provided(new_result, 'component'):
        if project is not None:
            component = find_component_by_reference(project, new_result.component)
            if component is None:
                component = Component()
                component.name = new_result.component.name
                if is_provided(new_result.component, 'code'):
                    component.code = new_result.component.code
                else:
                    component.code = component.name.lower().replace(' ', '-')
                project.components.append(component)
                project.save()
    if component is not None:
        new_result.component = create_component_reference(component)

    # create a testcase if needed
    if testcase is None and is_not_provided(new_result.testcase, 'name'):
        return Response('Existing testcase not found, please provide a testcase name if you want one to be created.\n', status=400, mimetype="text/plain")
    elif testcase is None:
        testcase = Testcase()
        testcase.name = new_result.testcase.name
        if is_provided(new_result.testcase, 'automationId'):
            testcase.automationId = new_result.testcase.automationId
        if is_provided(new_result.testcase, 'automationKey'):
            testcase.automationKey = new_result.testcase.automationKey
        if project is not None:
            testcase.project = create_project_reference(project)
        if component is not None:
            testcase.component = create_component_reference(component)
        testcase.tags = ['created-from-result',]
        testcase.save()

    # no matter what testcase should not be None at this point, but just in case I made a mistake
    if testcase is None:
        return Response('Somehow I was unable to find or create a testcase for this result.\n', status=400, mimetype="text/plain")
    new_result.testcase = create_testcase_reference(testcase)

    # dereference release and build if possible






    new_result.save()
    return JsonResponse(new_result)

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


