__author__ = 'Jason Corbett'

from slickqaweb.app import app
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build
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
    project = get_project(project_name)
    release = None
    build = None
    if project is not None:
        release = get_release(project, release_name)
        if release is not None:
            build = get_build(release, build_name)
    if project is None or release is None or build is None:
        return JsonResponse(None)

    assert isinstance(project, Project)
    assert isinstance(release, Release)
    assert isinstance(build, Build)

    report = TestrunGroup()
    report.name = "Build Report for {} {} Build {}".format(project.name, release.name, build.name)
    report.grouptype = "PARALLEL"
    report.created = build.built
    report.testruns = []
    testplans = []
    for testrun in Testrun.objects(build__buildId=build.id).order_by("-dateCreated"):
        assert isinstance(testrun, Testrun)
        if testrun.testplanId not in testplans:
            report.testruns.append(testrun)
            testplans.append(testrun.testplanId)

    return JsonResponse(report)


