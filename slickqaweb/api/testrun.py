import datetime

import bson
from slickqaweb.app import app
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from slickqaweb.model.result import Result
from .project import get_project, get_release, get_build
from flask import request, g
from .standardResponses import JsonResponse, read_request
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
    new_tr = deserialize_that(read_request(), Testrun())
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
                release = get_release(project, new_tr.release.id)
            if release is not None:
                build = get_build(release, new_tr.build.name)
                if build is None:
                    build = get_build(release, new_tr.build.id)
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

    how_many = Result.objects(testrun__testrunId=testrun.id, status=status).update(log=[], files=[],
                                                                                   runstatus="SCHEDULED",
                                                                                   status="NO_RESULT",
                                                                                   unset__hostname=True,
                                                                                   unset__started=True,
                                                                                   unset__finished=True,
                                                                                   unset__runlength=True)
    setattr(testrun.summary.resultsByStatus, status, getattr(testrun.summary.resultsByStatus, status) - how_many)
    testrun.summary.resultsByStatus.NO_RESULT += how_many
    testrun.save()
    return JsonResponse(Result.objects(testrun__testrunId=testrun.id, status="NO_RESULT", runstatus="SCHEDULED"))
