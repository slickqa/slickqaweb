import datetime

import bson
from bson import ObjectId
from flask import request
from mongoengine import ListField, ReferenceField, connection

from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from slickqaweb import events
from slickqaweb.app import app
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.query import queryFor
from slickqaweb.model.result import Result
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.testPlan import TestPlan
from slickqaweb.model.metric import Metric
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.utils import is_provided, is_not_provided
from .project import get_project, get_release, get_build
from .result import reschedule_individual_result, cancel_individual_result
from .standardResponses import JsonResponse, read_request

add_resource('/metrics', 'Add, update, and delete metrics.')

__author__ = 'lhigginson'


@app.route('/api/metrics')
@standard_query_parameters
@returns(ListField(ReferenceField(Metric)))
def get_metrics():
    """Query for metrics."""
    args = request.args.to_dict()
    if 'releaseid' in args:
        args['release.releaseId'] = args['releaseid']
        del args['releaseid']
    if 'testplanid' in args:
        args['testplanId'] = args['testplanid']
        del args['testplanid']

    return JsonResponse(queryFor(Metric, args))


def get_metric(metric_name_or_id):
    metric_id = None
    metric_name = metric_name_or_id
    try:
        metric_id = ObjectId(metric_name)
    except:
        pass
    if metric_id is None:
        return Metric.objects(name=metric_name).first()
    else:
        return Metric.objects(id=metric_id).first()


@app.route('/api/metrics/<metric_id>')
@returns(Metric)
@argument_doc('metric_id', "The id of the metric (the string representation of a BSON ObjectId).")
def get_metric_by_id(metric_id):
    """Retrieve a metric using it's id."""
    return JsonResponse(Metric.objects(id=metric_id).first())


@app.route('/api/metrics', methods=["POST"])
@accepts(Metric)
@returns(Metric)
@note("""If you do not supply the date created, one will be inserted for you.  If you do not provide the 'info'"
         property, but there is a description on the build, the info will be copied from the build.""")
def add_metric():
    """Create a new metric."""
    project_name = None
    release_name = None
    build_name = None
    raw = read_request()
    new_m = deserialize_that(raw, Metric())
    proj_id = None

    # resolve project, release and build, create if necessary
    if is_provided(new_m, 'project'):
        project_name = new_m.project.name
    if is_provided(new_m, 'release'):
        release_name = new_m.release.name
    if is_provided(new_m, 'build'):
        build_name = new_m.build.name

    if project_name is not None or release_name is not None or build_name is not None:
        # we have something to lookup / create
        proj_id, rel_id, bld_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name,
                                                                           create_if_missing=True)
        if proj_id is not None:
            new_m.project.id = proj_id
        if rel_id is not None:
            new_m.release.releaseId = rel_id
        if bld_id is not None:
            new_m.build.buildId = bld_id

    if is_not_provided(new_m, 'dateCreated'):
        new_m.dateCreated = datetime.datetime.utcnow()

    new_m.save()
    # add an event
    events.CreateEvent(new_m)

    return JsonResponse(new_m)


@app.route('/api/metrics/<metric_id>', methods=["PUT"])
@argument_doc('metric_id', "The id of the metric (the string representation of a BSON ObjectId).")
@accepts(Metric)
@returns(Metric)
def update_metric(metric_id):
    """Update the properties of a metric."""
    orig = Metric.objects(id=metric_id).first()
    update_event = events.UpdateEvent(before=orig)
    deserialize_that(read_request(), orig)
    if orig.state == "FINISHED" and is_not_provided(orig, 'runFinished'):
        orig.runFinished = datetime.datetime.utcnow()
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/metrics/<metric_id>', methods=["DELETE"])
@argument_doc('metric_id', "The id of the metric (the string representation of a BSON ObjectId).")
@returns(Metric)
def delete_metric(metric_id):
    """Remove a metric."""
    orig = Metric.objects(id=metric_id).first()

    # delete the reference from any metric groups
    trdbref = bson.DBRef('metrics', bson.ObjectId("531e4d26ded43258823d9c3a"))
    TestrunGroup.objects(__raw__={'metrics': {'$elemMatch': trdbref}}).update(pull__metrics=trdbref)

    # add an event
    events.DeleteEvent(orig)

    orig.delete()
    return JsonResponse(orig)
