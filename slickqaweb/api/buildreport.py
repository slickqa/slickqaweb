from slickqaweb.app import app
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.testrun import Testrun
from .standardResponses import JsonResponse
from .apidocs import add_resource, returns, argument_doc

from .cache import get_project_release_build_ids

__author__ = 'Jason Corbett'

# TODO: add error handling. Not sure how to handle that yet.

add_resource("/build-report", "Get build reports.")


@app.route('/api/build-report/<project_name>/<release_name>/<path:build_name>')
@returns(TestrunGroup)
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
def get_build_report(project_name, release_name, build_name):
    """Get all summary of all the testruns run against a particular build."""
    project_id, release_id, build_id = get_project_release_build_ids(project_name, release_name, build_name)
    if build_id is None:
        return JsonResponse(None)

    report = TestrunGroup()
    report.name = "Build Report for {} {} Build {}".format(project_name, release_name, build_name)
    report.grouptype = "PARALLEL"
    report.testruns = []
    report.created = None
    testplans = []
    for testrun in Testrun.objects(build__buildId=build_id).order_by("-dateCreated"):
        if report.created is None:
            report.created = testrun.dateCreated
        assert isinstance(testrun, Testrun)
        if testrun.testplanId not in testplans:
            report.testruns.append(testrun)
            testplans.append(testrun.testplanId)

    return JsonResponse(report)

