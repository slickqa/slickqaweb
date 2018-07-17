import datetime

import bson
from slickqaweb.app import app
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from slickqaweb.model.result import Result
from slickqaweb.model.project import Project
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.projectReference import ProjectReference
from .project import get_project, get_release, get_build
from flask import request, g
from .standardResponses import JsonResponse, read_request
from .result import get_results, reschedule_individual_result, cancel_individual_result
from slickqaweb import events
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField

add_resource('/testruns', 'Add, update, and delete testruns.')

__author__ = 'lhigginson'


@app.route('/api/testruns')
@standard_query_parameters
@returns(ListField(ReferenceField(Testrun)))
def get_testruns():
    """Query for testruns."""
    args = request.args.to_dict()
    if 'releaseid' in args:
        args['release.releaseId'] = args['releaseid']
        del args['releaseid']
    if 'testplanid' in args:
        args['testplanId'] = args['testplanid']
        del args['testplanid']

    return JsonResponse(queryFor(Testrun, args))


@app.route('/api/testruns/<testrun_id>')
@returns(Testrun)
@argument_doc('testrun_id', "The id of the testrun (the string representation of a BSON ObjectId).")
def get_testrun_by_id(testrun_id):
    """Retrieve a testrun using it's id."""
    return JsonResponse(Testrun.objects(id=testrun_id).first())


@app.route('/api/testruns', methods=["POST"])
@accepts(Testrun)
@returns(Testrun)
@note("""If you do not supply the date created, one will be inserted for you.  If you do not provide the 'info'"
         property, but there is a description on the build, the info will be copied from the build.""")
def add_testrun():
    """Create a new testrun."""
    project_name = None
    release_name = None
    build_name = None
    raw = read_request()
    new_tr = deserialize_that(raw, Testrun())
    proj_id = None

    # resolve project, release and build, create if necessary
    if is_provided(new_tr, 'project'):
        project_name = new_tr.project.name
    if is_provided(new_tr, 'release'):
        release_name = new_tr.release.name
    if is_provided(new_tr, 'build'):
        build_name = new_tr.build.name

    if project_name is not None or release_name is not None or build_name is not None:
        # we have something to lookup / create
        proj_id, rel_id, bld_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name,
                                                                           create_if_missing=True)
        if proj_id is not None:
            new_tr.project.id = proj_id
        if rel_id is not None:
            new_tr.release.releaseId = rel_id
        if bld_id is not None:
            new_tr.build.buildId = bld_id

    # if testplanId not provided, but testplan object is, resolve creating if necessary
    if is_not_provided(new_tr, 'testplanId') and 'testplan' in raw:
        tplan = TestPlan()
        tplan = deserialize_that(raw['testplan'], tplan)
        """:type : TestPlan"""

        query = {'name': tplan.name}
        if proj_id is not None:
            query['project__id'] = proj_id
        existing_plan = TestPlan.objects(**query).first()
        if existing_plan is not None:
            new_tr.testplanId = existing_plan.id
        else:
            if proj_id is not None:
                tplan.project = ProjectReference()
                tplan.project.id = proj_id
                tplan.project.name = new_tr.project.name
                tplan.save()
                new_tr.testplanId = tplan.id

    if is_not_provided(new_tr, 'dateCreated'):
        new_tr.dateCreated = datetime.datetime.utcnow()
    if is_not_provided(new_tr, 'info') and is_provided(new_tr, 'build') and \
       is_provided(new_tr, 'project') and is_provided(new_tr, 'release'):
        project = get_project(new_tr.project.name)
        build = None
        if project is None:
            project = get_project(new_tr.project.id)
        if project is not None:
            release = get_release(project, new_tr.release.name)
            if release is None:
                release = get_release(project, new_tr.release.releaseId)
            if release is not None:
                build = get_build(release, new_tr.build.name)
                if build is None:
                    build = get_build(release, new_tr.build.buildId)
        if build is not None and is_provided(build, 'description'):
            new_tr.info = build.description

    new_tr.save()
    # add an event
    events.CreateEvent(new_tr)

    return JsonResponse(new_tr)


@app.route('/api/testruns/<testrun_id>', methods=["PUT"])
@argument_doc('testrun_id', "The id of the testrun (the string representation of a BSON ObjectId).")
@accepts(Testrun)
@returns(Testrun)
def update_testrun(testrun_id):
    """Update the properties of a testrun."""
    orig = Testrun.objects(id=testrun_id).first()
    update_event = events.UpdateEvent(before=orig)
    deserialize_that(read_request(), orig)
    if orig.state == "FINISHED" and is_not_provided(orig, 'runFinished'):
        orig.runFinished = datetime.datetime.utcnow()
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/testruns/<testrun_id>', methods=["DELETE"])
@argument_doc('testrun_id', "The id of the testrun (the string representation of a BSON ObjectId).")
@returns(Testrun)
def delete_testrun(testrun_id):
    """Remove a testrun."""
    orig = Testrun.objects(id=testrun_id).first()

    # delete the reference from any testrun groups
    trdbref = bson.DBRef('testruns', bson.ObjectId("531e4d26ded43258823d9c3a"))
    TestrunGroup.objects(__raw__={'testruns': {'$elemMatch': trdbref}}).update(pull__testruns=trdbref)

    # add an event
    events.DeleteEvent(orig)

    orig.delete()
    return JsonResponse(orig)


@app.route('/api/testruns/<testrun_id>/reschedule/<status>')
@argument_doc('testrun_id', "The id of the testrun (the string representation of a BSON ObjectId).")
@returns(ListField(Result))
def reschedule_results_with_status_on_testrun(testrun_id, status):
    """Reschedule all results with a particular status for a testrun."""
    testrun = Testrun.objects(id=testrun_id).first()
    results_to_reschedule = Result.objects(testrun__testrunId=testrun.id, status=status)
    for result in results_to_reschedule:
        reschedule_individual_result(result.id)

    # how_many = Result.objects(testrun__testrunId=testrun.id, status=status).update(log=[], files=[],
    #                                                                                runstatus="SCHEDULED",
    #                                                                                status="NO_RESULT",
    #                                                                                unset__hostname=True,
    #                                                                                unset__started=True,
    #                                                                                unset__finished=True,
    #                                                                                unset__runlength=True,
    #                                                                                unset__reason=True)
    # setattr(testrun.summary.resultsByStatus, status, getattr(testrun.summary.resultsByStatus, status) - how_many)
    # testrun.summary.resultsByStatus.NO_RESULT += how_many
    # testrun.save()
    return JsonResponse(Result.objects(testrun__testrunId=testrun.id, status="NO_RESULT", runstatus="SCHEDULED"))


@app.route('/api/testruns/<testrun_id>/cancel')
@argument_doc('testrun_id', "The id of the testrun (the string representation of a BSON ObjectId).")
@returns(ListField(Result))
def cancel_results_from_testrun(testrun_id):
    """Cancel all results that are scheduled for this testrun."""
    testrun = Testrun.objects(id=testrun_id).first()
    results_to_cancel = Result.objects(testrun__testrunId=testrun.id, status='NO_RESULT', runstatus__in=['SCHEDULED', 'TO_BE_RUN'])
    for result in results_to_cancel:
        cancel_individual_result(result.id)
    return JsonResponse(Result.objects(testrun__testrunId=testrun.id, status="FINISHED", runstatus="SKIPPED"))


