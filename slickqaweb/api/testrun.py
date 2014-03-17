__author__ = 'lhigginson'

import datetime

import bson
from slickqaweb.app import app
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from .project import get_project, get_release, get_build
from flask import request, g
from .standardResponses import JsonResponse, read_request
from slickqaweb import events

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testruns')
def get_testruns():
    args = request.args.to_dict()
    if args.has_key('releaseid'):
        args['release.releaseId'] = args['releaseid']
        del args['releaseid']
    if args.has_key('testplanid'):
        args['testplanId'] = args['testplanid']
        del args['testplanid']

    return JsonResponse(queryFor(Testrun, args))

@app.route('/api/testruns/<testrun_id>')
def get_testrun_by_id(testrun_id):
    return JsonResponse(Testrun.objects(id=testrun_id).first())


@app.route('/api/testruns', methods=["POST"])
def add_testrun():
    new_tr = deserialize_that(read_request(), Testrun())
    if is_not_provided(new_tr, 'dateCreated'):
        new_tr.dateCreated = datetime.datetime.utcnow()
    if is_not_provided(new_tr, 'info') and is_provided(new_tr, 'build') and is_provided(new_tr, 'project') and is_provided(new_tr, 'release'):
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
def update_testrun(testrun_id):
    orig = Testrun.objects(id=testrun_id).first()
    update_event = events.UpdateEvent(before=orig)
    deserialize_that(read_request(), orig)
    if orig.state == "FINISHED" and is_not_provided(orig, 'runFinished'):
        orig.runFinished = datetime.datetime.utcnow()
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)

@app.route('/api/testruns/<testrun_id>', methods=["DELETE"])
def delete_testrun(testrun_id):
    orig = Testrun.objects(id=testrun_id).first()

    # delete the reference from any testrun groups
    trdbref = bson.DBRef('testruns', bson.ObjectId("531e4d26ded43258823d9c3a"))
    TestrunGroup.objects(__raw__={ 'testruns': { '$elemMatch': trdbref } }).update(pull__testruns=trdbref)

    # add an event
    events.DeleteEvent(orig)

    orig.delete()
    return JsonResponse(orig)
