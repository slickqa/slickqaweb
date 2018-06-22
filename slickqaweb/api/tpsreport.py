__author__ = 'Jason Corbett'

from slickqaweb.app import app
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request, g
from .standardResponses import JsonResponse, read_request
from .apidocs import add_resource, returns, argument_doc
from bson import ObjectId

from .project import get_project, get_release, get_build

# TODO: add error handling. Not sure how to handle that yet.

add_resource("/tps", "Get tps reports, without cover sheets on purpose.")

@app.route('/api/tps/<project_name>/<release_name>/<path:testplan_name>')
@returns(TestrunGroup)
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
def get_tps_report(project_name, release_name, testplan_name):
    """Get all summary of all the testruns run against a particular build."""
    project_id, release_id, _ = Project.lookup_project_release_build_ids(project_name, release_name, None)
    testplan = TestPlan.objects(project__id=project_id, name=testplan_name)[0]

    report = TestrunGroup()
    report.name = "{} Summary for {}".format(testplan_name, release_name)
    report.grouptype = "SERIAL"
    report.testruns = []
    report.testruns.extend(Testrun.objects(project__id=project_id, release__releaseId=release_id, testplanId=testplan.id).order_by('-dateCreated').limit(50))
    report.testruns.reverse()

    return JsonResponse(report)

