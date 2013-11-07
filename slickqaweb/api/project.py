from slickqaweb.app import app
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build
from slickqaweb.model.serialize import deserialize_that
from flask import Response, request
from .standardResponses import JsonResponse
from slickqaweb.model.query import buildQueryFromRequest
from bson import ObjectId
import datetime
import types

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/projects')
def get_projects():
    return JsonResponse(Project.objects(buildQueryFromRequest()))

@app.route('/api/projects/<project_name>')
@app.route('/api/projects/byname/<project_name>')
def get_project_by_name(project_name):
    project_id = None
    try:
        project_id = ObjectId(project_name)
    except:
        pass
    if project_id is None:
        return JsonResponse(Project.objects(name=project_name).first())
    else:
        return JsonResponse(Project.objects(id=project_id).first())



@app.route('/api/projects', methods=["POST"])
def add_project():
    new_project = deserialize_that(request.get_json(), Project())
    new_project.lastUpdated = datetime.datetime.utcnow()
    new_project.save()
    return JsonResponse(new_project)


@app.route('/api/projects/<project_name>', methods=["PUT"])
def update_project(project_name):
    orig = Project.objects(name=project_name).first()
    deserialize_that(request.get_json(), orig)
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)


# ----------------- For backwards compatibility -----------------------------
def get_project(project_id):
    return Project.objects(id=ObjectId(project_id)).first()

def get_release(project, release_id):
    assert isinstance(project, Project)
    for release in project.releases:
        if str(release.id) == release_id:
            return release

@app.route('/api/projects/<project_id>/name', methods=["PUT"])
def change_project_name(project_id):
    name = request.get_json()
    assert isinstance(name, types.StringTypes)
    orig = get_project(project_id)
    orig.name = name
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)

@app.route('/api/projects/<project_id>/description', methods=["PUT"])
def change_project_description(project_id):
    description = request.get_json()
    assert isinstance(description, types.StringTypes)
    orig = get_project(project_id)
    orig.description = description
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)

@app.route('/api/projects/<project_id>/releases')
def get_releases_for_project(project_id):
    project = get_project(project_id)
    return JsonResponse(project.releases)

@app.route('/api/projects/<project_id>/releases', methods=["POST"])
def add_release_for_project(project_id):
    project = get_project(project_id)
    assert isinstance(project, Project)
    rel = deserialize_that(request.get_json(), Release())
    if not hasattr(rel, 'id') or rel.id is None:
        rel.id = ObjectId()
    project.releases.append(rel)
    project.save()
    return JsonResponse(project.releases)

@app.route('/api/projects/<project_id>/releases/default')
def get_default_release_for_project(project_id):
    project = get_project(project_id)
    return JsonResponse(get_release(project, project.defaultRelease))

@app.route('/api/projects/<project_id>/releases/<release_id>')
def get_specific_release_for_project(project_id, release_id):
    return JsonResponse(get_release(get_project(project_id), release_id))

@app.route('/api/projects/<project_id>/setdefaultrelease/<release_id>')
def set_default_release_for_project(project_id, release_id):
    project = get_project(project_id)
    if project is not None:
        release = get_release(project, release_id)
        if release is not None:
            project.defaultRelease = release_id
            project.lastUpdated = datetime.datetime.utcnow()
            project.save()
            return JsonResponse(project)


