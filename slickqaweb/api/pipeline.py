import datetime

from bson import ObjectId
from flask import request
from mongoengine import ListField, ReferenceField, EmbeddedDocumentListField

from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from slickqaweb import events
from slickqaweb.app import app
from slickqaweb.model.phase import Phase, EmbeddedDocumentField
from slickqaweb.model.pipeline import Pipeline
from slickqaweb.model.project import Project
from slickqaweb.model.query import queryFor
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.utils import is_provided, is_not_provided
from .standardResponses import JsonResponse, read_request

add_resource('/pipelines', 'Add, update, and delete pipelines.')

__author__ = 'sjensen'


@app.route('/api/pipelines')
@standard_query_parameters
@returns(ListField(ReferenceField(Pipeline)))
def get_pipelines():
    """Query for pipelines."""
    args = request.args.to_dict()
    if 'releaseid' in args:
        args['release.releaseId'] = args['releaseid']
        del args['releaseid']
    if 'testplanid' in args:
        args['testplanId'] = args['testplanid']
        del args['testplanid']

    return JsonResponse(queryFor(Pipeline, args))


def get_pipeline(pipeline_name_or_id):
    pipeline_id = None
    pipeline_name = pipeline_name_or_id
    try:
        pipeline_id = ObjectId(pipeline_name)
    except:
        pass
    if pipeline_id is None:
        return Pipeline.objects(name=pipeline_name).first()
    else:
        return Pipeline.objects(id=pipeline_id).first()


@app.route('/api/pipelines/<pipeline_id>')
@returns(Pipeline)
@argument_doc('pipeline_id', "The id of the pipeline (the string representation of a BSON ObjectId).")
def get_pipeline_by_id(pipeline_id):
    """Retrieve a pipeline using it's id."""
    return JsonResponse(Pipeline.objects(id=pipeline_id).first())


@app.route('/api/pipelines/<pipeline_name_or_id>/add_phase', methods=["POST"])
@returns(Pipeline)
@argument_doc('pipeline_name_or_id', "The id of the pipeline (the string representation of a BSON ObjectId).")
def add_phase_to_pipeline(pipeline_name_or_id):
    """Retrieve a pipeline using it's id."""

    pipeline = get_pipeline(pipeline_name_or_id)
    if pipeline:
        raw = read_request()
        new_phases = []
        if isinstance(raw, list):
            new_phases = deserialize_that(raw, EmbeddedDocumentListField(Phase))
        else:
            new_phases.append(deserialize_that(raw, EmbeddedDocumentField(Phase)))
        if pipeline.phases and not pipeline.phases[-1].finished:
            pipeline.phases[-1].finished = datetime.datetime.utcnow()
        for phase in new_phases:
            if phase.state != "TO_BE_RUN" and is_not_provided(phase, 'started'):
                phase.started = datetime.datetime.utcnow()
            if phase.status != "NO_RESULT" and is_not_provided(phase, 'finished'):
                phase.finished = datetime.datetime.utcnow()
                phase.state = "FINISHED"
            pipeline.phases.append(phase)
        pipeline.save()
    return JsonResponse(pipeline)


@app.route('/api/pipelines/<pipeline_name_or_id>/<phase_name>', methods=["PUT"])
@returns(Pipeline)
@argument_doc('pipeline_name_or_id', "The id of the pipeline (the string representation of a BSON ObjectId).")
def update_phase_in_pipeline(pipeline_name_or_id, phase_name):
    """Retrieve a pipeline using it's id."""
    pipeline = get_pipeline(pipeline_name_or_id)
    if pipeline:
        phase = [ind for ind, x in enumerate(pipeline.phases) if x.name == phase_name]
        if phase:
            index = phase[0]
            pipeline.phases[index] = deserialize_that(read_request(), pipeline.phases[index])
            if pipeline.phases[index].state != "TO_BE_RUN" and is_not_provided(pipeline.phases[index], 'started'):
                pipeline.phases[index].started = datetime.datetime.utcnow()
            if pipeline.phases[index].status != "NO_RESULT" and is_not_provided(pipeline.phases[index], 'finished'):
                pipeline.phases[index].finished = datetime.datetime.utcnow()
                pipeline.phases[index].state = "FINISHED"
            elif pipeline.phases[index].status == "NO_RESULT":
                pipeline.phases[index].finished = None
                pipeline.phases[index].state = "RUNNING"
            pipeline.save()
    return JsonResponse(pipeline)


@app.route('/api/pipelines', methods=["POST"])
@accepts(Pipeline)
@returns(Pipeline)
@note("""If you do not supply the date created, one will be inserted for you.  If you do not provide the 'info'"
         property, but there is a description on the build, the info will be copied from the build.""")
def add_pipeline():
    """Create a new pipeline."""
    project_name = None
    release_name = None
    build_name = None
    raw = read_request()
    new_pipeline = deserialize_that(raw, Pipeline())
    proj_id = None
    existing_pipeline = get_pipeline(new_pipeline.name)
    if existing_pipeline:
        new_pipeline = deserialize_that(raw, existing_pipeline)
    else:
        # resolve project, release and build, create if necessary
        if is_provided(new_pipeline, 'project'):
            project_name = new_pipeline.project.name
        if is_provided(new_pipeline, 'release'):
            release_name = new_pipeline.release.name
        if is_provided(new_pipeline, 'build'):
            build_name = new_pipeline.build.name

        if project_name is not None or release_name is not None or build_name is not None:
            # we have something to lookup / create
            proj_id, rel_id, bld_id = Project.lookup_project_release_build_ids(project_name, release_name, build_name,
                                                                               create_if_missing=True)
            if proj_id is not None:
                new_pipeline.project.id = proj_id
            if rel_id is not None:
                new_pipeline.release.releaseId = rel_id
            if bld_id is not None:
                new_pipeline.build.buildId = bld_id

    for phase in new_pipeline.phases:
        if phase.state != "TO_BE_RUN" and is_not_provided(phase, 'started'):
            phase.started = datetime.datetime.utcnow()
        if phase.status != "NO_RESULT" and is_not_provided(phase, 'finished'):
            phase.state = "FINISHED"
            phase.finished = datetime.datetime.utcnow()
    if new_pipeline.status == 'FINISHED' and is_not_provided(new_pipeline, 'finished'):
        new_pipeline.finished = datetime.datetime.utcnow()
    elif new_pipeline.status != 'FINISHED' and is_provided(new_pipeline, 'finished'):
        new_pipeline.finished = None
    new_pipeline.save()
    # add an event
    events.CreateEvent(new_pipeline)

    return JsonResponse(new_pipeline)


@app.route('/api/pipelines/<pipeline_id>', methods=["PUT"])
@argument_doc('pipeline_id', "The id of the pipeline (the string representation of a BSON ObjectId).")
@accepts(Pipeline)
@returns(Pipeline)
def update_pipeline(pipeline_id):
    """Update the properties of a pipeline."""
    orig = Pipeline.objects(id=pipeline_id).first()
    update_event = events.UpdateEvent(before=orig)
    deserialize_that(read_request(), orig)
    if orig.state == "FINISHED" and is_not_provided(orig, 'finished'):
        orig.finished = datetime.datetime.utcnow()
    elif orig.state != "FINISHED":
        orig.finished = None
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/pipelines/<pipeline_id>', methods=["DELETE"])
@argument_doc('pipeline_id', "The id of the pipeline (the string representation of a BSON ObjectId).")
@returns(Pipeline)
def delete_pipeline(pipeline_id):
    """Remove a pipeline."""
    orig = Pipeline.objects(id=pipeline_id).first()

    # delete the reference from any pipeline groups

    # add an event
    events.DeleteEvent(orig)

    orig.delete()
    return JsonResponse(orig)
