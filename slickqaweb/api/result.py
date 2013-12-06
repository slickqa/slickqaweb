__author__ = 'jcorbett'

from .standardResponses import JsonResponse, read_request
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.query import buildQueryFromRequest
from slickqaweb.app import app
from slickqaweb.model.result import Result
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.resultReference import ResultReference
from slickqaweb.model.logEntry import LogEntry
from slickqaweb.model.dereference import find_testcase_by_reference, find_project_by_reference, find_testrun_by_reference, find_component_by_reference, find_release_by_reference, find_build_by_reference, find_configuration_by_reference
from slickqaweb.model.reference import create_project_reference, create_testcase_reference, create_component_reference, create_release_reference, create_build_reference, create_configuration_reference, create_testrun_reference, create_result_reference
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.component import Component
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build
from slickqaweb.model.configuration import Configuration
from slickqaweb.model.configurationReference import ConfigurationReference

from bson import ObjectId
import types
import datetime
from mongoengine import Q
from flask import request, Response

def find_history(result):
    assert isinstance(result, Result)
    history = []
    results_found = []

    # other results with the same Test, Environment, Release
    # other results with the same Test and Environment (different release)
    # other results with the same Test and Release, but different Environment
    # other results with the same Test, in order of when they were recorded
    try:
        for hresult in Result.objects(testcase__testcaseId=result.testcase.testcaseId,
                                      config__configId=result.config.configId,
                                      release__releaseId=result.release.releaseId,
                                      recorded__lt=result.recorded).order_by('-recorded'):
            if len(history) < 10:
                history.append(create_result_reference(hresult))
                results_found.append(hresult.id)
            else:
                break
    except:
        pass
    if len(history) >= 10:
        return history
    try:
        for hresult in Result.objects(testcase__testcaseId=result.testcase.testcaseId,
                                      config__configId=result.config.configId,
                                      id__nin=results_found,
                                      recorded__lt=result.recorded).order_by('-recorded'):
            if len(history) < 10:
                history.append(create_result_reference(hresult))
                results_found.append(hresult.id)
            else:
                break
    except:
        pass
    if len(history) >= 10:
        return history
    try:
        for hresult in Result.objects(testcase__testcaseId=result.testcase.testcaseId,
                                      id__nin=results_found,
                                      release__releaseId=result.release.releaseId,
                                      recorded__lt=result.recorded).order_by('-recorded'):
            if len(history) < 10:
                history.append(create_result_reference(hresult))
                results_found.append(hresult.id)
            else:
                break
    except:
        pass
    if len(history) >= 10:
        return history
    try:
        for hresult in Result.objects(testcase__testcaseId=result.testcase.testcaseId,
                                      id__nin=results_found,
                                      recorded__lt=result.recorded).order_by('-recorded'):
            if len(history) < 10:
                history.append(create_result_reference(hresult))
            else:
                break
    except:
        pass
    return history





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


@app.route('/api/results', methods=["POST"])
def add_result():
    new_result = deserialize_that(read_request(), Result())
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
        new_result.recorded = datetime.datetime.utcnow()

    # resolve references -----------------------------------------------------
    testrun = None
    project = None
    testcase = None
    release = None
    build = None
    component = None
    configuration = None

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
        project = find_project_by_reference(new_result.project)
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
                component.id = ObjectId()
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
    if is_provided(new_result, 'release') and project is not None:
        release = find_release_by_reference(project, new_result.release)
    if release is None and testrun is not None and is_provided(testrun, 'release'):
        release = find_release_by_reference(testrun.release, new_result.release)
    if release is None and project is not None and is_provided(new_result, 'release') and is_provided(new_result.release, 'name'):
        release = Release()
        release.id = ObjectId()
        release.name = new_result.release.name
        project.releases.append(release)
        project.save()
    if release is not None:
        new_result.release = create_release_reference(release)
        if is_provided(new_result, 'build'):
            build = find_build_by_reference(release, new_result.build)
        if build is None and testrun is not None and is_provided(testrun, 'build'):
            build = find_build_by_reference(release, testrun.build)
        if build is None and project is not None and is_provided(new_result, 'build') and is_provided(new_result.build, 'name'):
            build = Build()
            build.id = ObjectId()
            build.name = new_result.build.name
            build.built = datetime.datetime.utcnow()
            release.builds.append(build)
            project.save()
        if build is not None:
            new_result.build = create_build_reference(build)

    # dereference configuration
    if is_provided(new_result, 'config'):
        configuration = find_configuration_by_reference(new_result.config)
    if configuration is None and testrun is not None and is_provided(testrun, 'config'):
        configuration = find_configuration_by_reference(testrun.config)
    if configuration is None and is_provided(new_result, 'config') and is_provided(new_result.config, 'name'):
        configuration = Configuration()
        configuration.name = new_result.config.name
        if is_provided(new_result.config, 'filename'):
            configuration.filename = new_result.config.filename
        configuration.save()
    if configuration is not None:
        new_result.config = create_configuration_reference(configuration)

    # if there is no testrun, create one with the information provided
    if testrun is None:
        testrun = Testrun()
        if is_provided(new_result, 'testrun') and is_provided(new_result.testrun, 'name'):
            testrun.name = new_result.testrun.name
        else:
            testrun.name = 'Testrun starting %s' % str(datetime.datetime.utcnow())
        if project is not None:
            testrun.project = create_project_reference(project)
        if configuration is not None:
            testrun.config = create_configuration_reference(configuration)
        if release is not None:
            testrun.release = create_release_reference(release)
        if build is not None:
            testrun.build = create_build_reference(build)
        testrun.dateCreated = datetime.datetime.utcnow()
        testrun.runStarted = datetime.datetime.utcnow()
        testrun.state = 'RUNNING'
        testrun.save()

    if testrun is not None:
        new_result.testrun = create_testrun_reference(testrun)

        status_name = "inc__summary__resultsByStatus__" + new_result.status
        Testrun.objects(id=testrun.id).update_one(**{status_name: 1})

    new_result.history = find_history(new_result)
    new_result.save()


    return JsonResponse(new_result)

@app.route('/api/results/<result_id>', methods=["PUT"])
def update_result(result_id):
    orig = Result.objects(id=result_id).first()
    update = read_request()
    if  'status' in update and update['status'] != orig.status:
        atomic_update = {
            'dec__summary__resultsByStatus__' + orig.status: 1,
            'inc__summary__resultsByStatus__' + update['status']: 1
        }
        Testrun.objects(id=orig.testrun.testrunId).update_one(**atomic_update)
    deserialize_that(update, orig)
    orig.save()
    return JsonResponse(orig)

@app.route('/api/results/<result_id>/log', methods=["POST"])
def add_to_log(result_id):
    orig = Result.objects(id=result_id).first()
    if not hasattr(orig, 'log') or orig.log is None:
        orig.log = []

    list_of_log_entries = read_request()
    if isinstance(list_of_log_entries, types.ListType):
        for entry_json in list_of_log_entries:
            orig.log.append(deserialize_that(entry_json, LogEntry()))
    else:
        orig.log.append(deserialize_that(list_of_log_entries, LogEntry()))
    orig.save()
    return JsonResponse(len(orig.log))


