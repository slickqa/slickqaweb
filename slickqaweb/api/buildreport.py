import bson

from slickqaweb.api.result import cancel_individual_result, reschedule_individual_result
from slickqaweb.model.result import Result

__author__ = 'Jason Corbett'

from slickqaweb.app import app
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build, ListField
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request, g
from .standardResponses import JsonResponse, read_request
from .apidocs import add_resource, returns, argument_doc
from bson import ObjectId

from .project import get_project, get_release, get_build

# TODO: add error handling. Not sure how to handle that yet.

add_resource("/build-report", "Get build reports.")

@app.route('/api/build-report/<project_name>/<release_name>/<path:build_name>')
@returns(TestrunGroup)
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
def get_build_report(project_name, release_name, build_name):
    """Get all summary of all the testruns run against a particular build."""
    project_id, release_id, build_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name)

    report = TestrunGroup()
    report.name = "Build Report for {} {} Build {}".format(project_name, release_name, build_name)
    report.grouptype = "PARALLEL"
    report.testruns = []
    testplans = []
    if build_id is None:
        return JsonResponse(None)
    for testrun in Testrun.objects(build__buildId=build_id).order_by("-dateCreated"):
        assert isinstance(testrun, Testrun)
        if testrun.testplanId not in testplans:
            report.testruns.append(testrun)
            testplans.append(testrun.testplanId)

    return JsonResponse(report)

@app.route('/api/release-report/<project_name>/<release_name>')
@returns(dict)
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
def get_build_reports(project_name, release_name):
    """Get all summary of all the builds for a particular release."""
    limit = 15
    if request.args.get("limit"):
        try:
            limit = int(request.args.get("limit"))
        except:
            pass
    groupType = "SERIAL"
    if request.args.get("groupType"):
        groupType = request.args.get("groupType");
    project_id, release_id, build_id = Project.lookup_project_release_build_ids(project_name, release_name, None, get_all_builds=True, limit=limit)
    report = {}
    report['name'] = "Release Report for {} {}".format(project_name, release_name)
    report['builds'] = []
    report['grouptype'] = groupType
    if build_id is None:
        return JsonResponse({})
    for build_object in build_id:
        testrun_group = TestrunGroup()
        testrun_group.name = "Build Report for {} {} Build {}".format(project_name, release_name, build_object.name)
        testrun_group.grouptype = groupType
        testrun_group.testruns = Testrun.objects(build__buildId=build_object.id).order_by("-dateCreated")
        report['builds'].append(testrun_group)

    return JsonResponse(report)

@app.route('/api/build-report/<project_name>/<release_name>/recent-builds')
@returns(TestrunGroup)
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
def get_recent_builds_for_release(project_name, release_name, build_name):
    """Get all summary of all the testruns run against a particular build."""
    project_id, release_id, build_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name)

    report = TestrunGroup()
    report.name = "Build Report for {} {} Build {}".format(project_name, release_name, build_name)
    report.grouptype = "PARALLEL"
    report.testruns = []
    testplans = []
    if build_id is None:
        return JsonResponse(None)
    for testrun in Testrun.objects(build__buildId=build_id).order_by("-dateCreated"):
        assert isinstance(testrun, Testrun)
        if testrun.testplanId not in testplans:
            report.testruns.append(testrun)
            testplans.append(testrun.testplanId)

    return JsonResponse(report)

@app.route('/api/build-report/<project_name>/<release_name>/<path:build_name>/reschedule/<status>')
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
@argument_doc('status', 'The name of the status to reschedule for the build')
@returns(ListField(Result))
def reschedule_results_with_status_on_build(project_name, release_name, build_name, status):
    """Reschedule all results with a particular status for a build."""
    project_id, release_id, build_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name)

    rescheduled_results = []
    if build_id is None:
        return JsonResponse(None)
    for testrun in Testrun.objects(build__buildId=build_id).order_by("-dateCreated"):
        results_to_reschedule = Result.objects(testrun__testrunId=testrun.id, status=status)
        rescheduled_results.extend(results_to_reschedule)
        for result in results_to_reschedule:
            reschedule_individual_result(result.id)
    return JsonResponse(rescheduled_results)


@app.route('/api/build-report/<project_name>/<release_name>/<path:build_name>/cancel')
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
@returns(ListField(Result))
def cancel_results_for_build(project_name, release_name, build_name):
    """Cancel all results that are scheduled for this build."""
    project_id, release_id, build_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name)

    canceled_results = []
    if build_id is None:
        return JsonResponse(None)
    for testrun in Testrun.objects(build__buildId=build_id).order_by("-dateCreated"):
        results_to_cancel = Result.objects(testrun__testrunId=testrun.id, status='NO_RESULT', runstatus__in=['SCHEDULED', 'TO_BE_RUN'])
        canceled_results.extend(results_to_cancel)
        for result in results_to_cancel:
            cancel_individual_result(result.id)
    return JsonResponse(canceled_results)

