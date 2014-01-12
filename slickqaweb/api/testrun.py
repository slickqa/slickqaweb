__author__ = 'lhigginson'

import datetime

from slickqaweb.app import app
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import buildQueryFromRequest
from flask import request, g
from .standardResponses import JsonResponse, read_request
from slickqaweb import events

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/testruns')
def get_testruns():
    return JsonResponse(Testrun.objects(buildQueryFromRequest()))

@app.route('/api/testruns/<testrun_id>')
def get_testrun_by_id(testrun_id):
    return JsonResponse(Testrun.objects(id=testrun_id).first())


@app.route('/api/testruns', methods=["POST"])
def add_testrun():
    new_tr = deserialize_that(read_request(), Testrun())
    if is_not_provided(new_tr, 'dateCreated'):
        new_tr.dateCreated = datetime.datetime.utcnow()
    new_tr.save()
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
