from slickqaweb.app import app
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.component import Component
from slickqaweb.model.build import Build
from slickqaweb.model.serialize import deserialize_that
from flask import Response, request
from .standardResponses import JsonResponse, read_request
from slickqaweb.model.query import queryFor
from slickqaweb import events
from bson import ObjectId
import datetime
import types

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/projects')
def get_projects():
    return JsonResponse(queryFor(Project))

def get_project(project_name_or_id):
    project_id = None
    project_name = project_name_or_id
    try:
        project_id = ObjectId(project_name)
    except:
        pass
    if project_id is None:
        return Project.objects(name=project_name).first()
    else:
        return Project.objects(id=project_id).first()

@app.route('/api/projects/<project_name>')
@app.route('/api/projects/byname/<project_name>')
def get_project_by_name(project_name):
    return JsonResponse(get_project(project_name))

@app.route('/api/projects', methods=["POST"])
def add_project():
    new_project = deserialize_that(read_request(), Project())
    new_project.lastUpdated = datetime.datetime.utcnow()
    new_project.save()
    events.CreateEvent(new_project)
    return JsonResponse(new_project)


@app.route('/api/projects/<project_name>', methods=["PUT"])
def update_project(project_name):
    orig = get_project(project_name)
    update_event = events.UpdateEvent(orig)
    deserialize_that(read_request(), orig)
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/projects/<project_name>', methods=["DELETE"])
def delete_project(project_name):
    project = get_project(project_name)
    if project is not None:
        events.DeleteEvent(project)
        project.delete()

# ----------------- For backwards compatibility -----------------------------
@app.route('/api/projects/<project_id>/name', methods=["PUT"])
def change_project_name(project_id):
    name = read_request()
    assert isinstance(name, types.StringTypes)
    orig = get_project(project_id)
    orig.name = name
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)

@app.route('/api/projects/<project_id>/description', methods=["PUT"])
def change_project_description(project_id):
    description = read_request()
    assert isinstance(description, types.StringTypes)
    orig = get_project(project_id)
    orig.description = description
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)


def get_release(project, release_id_or_name):
    assert isinstance(project, Project)
    release_id = None
    release_name = release_id_or_name
    try:
        release_id = ObjectId(release_id_or_name)
    except:
        pass

    for release in project.releases:
        if release.id == release_id or release.name == release_name:
            return release

@app.route('/api/projects/<project_id>/releases')
def get_releases_for_project(project_id):
    project = get_project(project_id)
    return JsonResponse(project.releases)

@app.route('/api/projects/<project_id>/releases', methods=["POST"])
def add_release_for_project(project_id):
    project = get_project(project_id)
    assert isinstance(project, Project)
    rel = deserialize_that(read_request(), Release())
    if not hasattr(rel, 'id') or rel.id is None:
        rel.id = ObjectId()
    if not hasattr(project, 'releases'):
        project.releases = []
    project.releases.append(rel)
    project.save()
    return JsonResponse(rel)

@app.route('/api/projects/<project_id>/releases/default')
def get_default_release_for_project(project_id):
    project = get_project(project_id)
    return JsonResponse(get_release(project, project.defaultRelease))

@app.route('/api/projects/<project_id>/releases/<release_id>')
@app.route('/api/projects/<project_id>/releases/byname/<release_id>')
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

@app.route('/api/projects/<project_id>/releases/<release_id>', methods=["PUT"])
def update_release(project_id, release_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    deserialize_that(read_request(), release)
    project.save()
    return JsonResponse(release)

@app.route('/api/projects/<project_id>/releases/<release_id>', methods=["DELETE"])
def delete_release(project_id, release_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    project.releases.remove(release)
    project.save()
    return JsonResponse(project.releases)

def get_build(release, build_id_or_name):
    assert isinstance(release, Release)
    build_id = None
    build_name = build_id_or_name
    try:
        build_id = ObjectId(build_id_or_name)
    except:
        pass

    for build in release.builds:
        if build.id == build_id or build.name == build_name:
            return build

@app.route('/api/projects/<project_id>/releases/<release_id>/builds')
def get_builds(project_id, release_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    return JsonResponse(release.builds)

@app.route('/api/projects/<project_id>/releases/<release_id>/builds', methods=["POST"])
def add_build(project_id, release_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    assert isinstance(project, Project)
    assert isinstance(release, Release)
    build = deserialize_that(read_request(), Build())
    if not hasattr(build, 'id') or build.id is None:
        build.id = ObjectId()
    if not hasattr(release, 'builds'):
        release.builds = []
    release.builds.append(build)
    project.save()
    return JsonResponse(build)

@app.route('/api/projects/<project_id>/releases/<release_id>/builds/default')
def get_default_build(project_id, release_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    return JsonResponse(get_build(release, release.defaultBuild))

@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<build_id>')
@app.route('/api/projects/<project_id>/releases/<release_id>/builds/byname/<build_id>')
def get_specific_build(project_id, release_id, build_id):
    return JsonResponse(get_build(get_release(get_project(project_id), release_id), build_id))

@app.route('/api/projects/<project_id>/releases/<release_id>/builds/setdefaultbuild/<build_id>')
def set_default_build(project_id, release_id, build_id):
    project = get_project(project_id)
    if project is not None:
        release = get_release(project, release_id)
        if release is not None:
            build = get_build(release, build_id)
            if build is not None:
                release.defaultBuild = str(build.id)
                project.lastUpdated = datetime.datetime.utcnow()
                project.save()
                return JsonResponse(project)

@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<build_id>', methods=["PUT"])
def update_build(project_id, release_id, build_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    build = get_build(release, build_id)
    deserialize_that(read_request(), build)
    project.save()
    return JsonResponse(build)

@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<build_id>', methods=["DELETE"])
def delete_build(project_id, release_id, build_id):
    project = get_project(project_id)
    release = get_release(project, release_id)
    build = get_build(release, build_id)
    release.builds.remove(build)
    project.save()
    return JsonResponse(release.builds)

def get_component(project, component_id_or_name):
    assert isinstance(project, Project)
    component_id = None
    component_name = component_id_or_name
    try:
        component_id = ObjectId(component_id_or_name)
    except:
        pass

    for component in project.components:
        if component.id == component_id or component.name == component_name:
            return component

@app.route('/api/projects/<project_id>/components')
def get_components(project_id):
    project = get_project(project_id)
    return JsonResponse(project.components)

@app.route('/api/projects/<project_id>/components', methods=["POST"])
def add_component_for_project(project_id):
    project = get_project(project_id)
    assert isinstance(project, Project)
    component = deserialize_that(read_request(), Component())
    if not hasattr(component, 'id') or component.id is None:
        component.id = ObjectId()
    if not hasattr(project, 'components'):
        project.components = []
    project.components.append(component)
    project.save()
    return JsonResponse(component)

@app.route('/api/projects/<project_id>/components/<component_id>')
@app.route('/api/projects/<project_id>/components/byname/<path:component_id>')
def get_specific_component_for_project(project_id, component_id):
    return JsonResponse(get_component(get_project(project_id), component_id))

@app.route('/api/projects/<project_id>/components/<component_id>', methods=["PUT"])
def update_component(project_id, component_id):
    project = get_project(project_id)
    component = get_component(project, component_id)
    deserialize_that(read_request(), component)
    project.save()
    return JsonResponse(component)

@app.route('/api/projects/<project_id>/components/<component_id>', methods=["DELETE"])
def delete_component(project_id, component_id):
    project = get_project(project_id)
    component = get_component(project, component_id)
    project.components.remove(component)
    project.save()
    return JsonResponse(project.components)


