from slickqaweb.app import app
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.component import Component
from slickqaweb.model.build import Build
from slickqaweb.model.serialize import deserialize_that
from flask import Response, request
from .standardResponses import JsonResponse, read_request
from .apidocs import accepts, returns, argument_doc, add_resource, standard_query_parameters
from slickqaweb.model.query import queryFor
from slickqaweb import events
from bson import ObjectId
import datetime
import types
import mongoengine

add_resource("/projects", "Access to and modification of projects in slick.")


# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/projects')
@returns(mongoengine.ListField(mongoengine.ReferenceField(Project)))
@standard_query_parameters
def get_projects():
    """Query for available projects in slick"""
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
@returns(Project)
@argument_doc('project_name', "The name or id of the project to find.")
def get_project_by_name(project_name):
    """Find a project by name or id"""
    return JsonResponse(get_project(project_name))


@app.route('/api/projects', methods=["POST"])
@returns(Project)
@accepts(Project)
def add_project():
    """Add a new Project to slick."""
    new_project = deserialize_that(read_request(), Project())
    new_project.lastUpdated = datetime.datetime.utcnow()
    new_project.save()
    events.CreateEvent(new_project)
    return JsonResponse(new_project)


@app.route('/api/projects/<project_name>', methods=["PUT"])
@accepts(Project)
@returns(Project)
@argument_doc('project_name', "The name or id of the project to update.")
def update_project(project_name):
    """Update an existing project.  Only modified parameters are required."""
    orig = get_project(project_name)
    update_event = events.UpdateEvent(orig)
    deserialize_that(read_request(), orig)
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/projects/<project_name>', methods=["DELETE"])
@argument_doc('project_name', "The name or id of the project to delete.")
def delete_project(project_name):
    """Delete an existing project"""
    project = get_project(project_name)
    if project is not None:
        events.DeleteEvent(project)
        project.delete()


@app.route('/api/projects/<project_id>/name', methods=["PUT"])
@argument_doc('project_id', "The name or id of the project to use.")
@accepts(mongoengine.StringField(help_text="The new name of project."))
@returns(Project)
def change_project_name(project_id):
    """For backwards compatibility: Change the name of a project."""
    name = read_request()
    assert isinstance(name, types.StringTypes)
    orig = get_project(project_id)
    orig.name = name
    orig.lastUpdated = datetime.datetime.utcnow()
    orig.save()
    return JsonResponse(orig)


@app.route('/api/projects/<project_id>/description', methods=["PUT"])
@argument_doc('project_id', "The name or id of the project to use.")
@accepts(mongoengine.StringField(help_text="The new description of project."))
@returns(Project)
def change_project_description(project_id):
    """For backwards compatibility: Change the description of a project."""
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
@argument_doc('project_id', "The name or id of the project to get releases from.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Release)))
def get_releases_for_project(project_id):
    """Get the releases for a project."""
    project = get_project(project_id)
    return JsonResponse(project.releases)


@app.route('/api/projects/<project_id>/releases', methods=["POST"])
@argument_doc('project_id', "The name or id of the project to add a release to.")
@accepts(Release)
@returns(Release)
def add_release_for_project(project_id):
    """Add a release to a project"""
    project = get_project(project_id)
    assert isinstance(project, Project)
    rel = deserialize_that(read_request(), Release())
    if not hasattr(rel, 'id') or rel.id is None:
        rel.id = ObjectId()
    if not hasattr(project, 'releases'):
        project.releases = []
    if not hasattr(rel, 'builds'):
        rel.builds = []
    project.releases.append(rel)
    project.save()
    return JsonResponse(rel)


@app.route('/api/projects/<project_id>/releases/default')
@argument_doc('project_id', "The name or id of the project to get the default release from.")
@returns(Release)
def get_default_release_for_project(project_id):
    """Get the default release of a project."""
    project = get_project(project_id)
    return JsonResponse(get_release(project, project.defaultRelease))


@app.route('/api/projects/<project_id>/releases/<release_id>')
@app.route('/api/projects/<project_id>/releases/byname/<release_id>')
@argument_doc('project_id', "The name or id of the project to get a release from.")
@argument_doc('release_id', "The name or id of the release to get.")
@returns(Release)
def get_specific_release_for_project(project_id, release_id):
    """Get a release of a project by it's name or id."""
    return JsonResponse(get_release(get_project(project_id), release_id))


@app.route('/api/projects/<project_id>/setdefaultrelease/<release_id>')
@argument_doc('project_id', "The name or id of the project to get a release from.")
@argument_doc('release_id', "The name or id of the release to set as default.")
@returns(Project)
def set_default_release_for_project(project_id, release_id):
    """Set a default release for a project."""
    project = get_project(project_id)
    if project is not None:
        release = get_release(project, release_id)
        if release is not None:
            project.defaultRelease = release_id
            project.lastUpdated = datetime.datetime.utcnow()
            project.save()
            return JsonResponse(project)


@app.route('/api/projects/<project_id>/releases/<release_id>', methods=["PUT"])
@argument_doc('project_id', "The name or id of the project to update a release from.")
@argument_doc('release_id', "The name or id of the release to update.")
@accepts(Release)
@returns(Release)
def update_release(project_id, release_id):
    """Update a release"""
    project = get_project(project_id)
    release = get_release(project, release_id)
    deserialize_that(read_request(), release)
    project.save()
    return JsonResponse(release)


@app.route('/api/projects/<project_id>/releases/<release_id>', methods=["DELETE"])
@argument_doc('project_id', "The name or id of the project to delete a release from.")
@argument_doc('release_id', "The name or id of the release to delete.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Release), help_text='The releases left in the project'))
def delete_release(project_id, release_id):
    """Delete a release"""
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
@argument_doc('project_id', "The name or id of the project to get builds from.")
@argument_doc('release_id', "The name or id of the release to get builds from.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Build)))
def get_builds(project_id, release_id):
    """Get all the builds of a release (and project)."""
    project = get_project(project_id)
    release = get_release(project, release_id)
    if release is None:
        return JsonResponse(None)
    if not hasattr(release, 'builds'):
        release.builds = []
        project.save()
    return JsonResponse(release.builds)


@app.route('/api/projects/<project_id>/releases/<release_id>/builds', methods=["POST"])
@argument_doc('project_id', "The name or id of the project to add a build to.")
@argument_doc('release_id', "The name or id of the release to add a build to.")
@accepts(Build)
@returns(Build)
def add_build(project_id, release_id):
    """Add a build to a release (and project)."""
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
@argument_doc('project_id', "The name or id of the project to get the build from.")
@argument_doc('release_id', "The name or id of the release to get the build from.")
@returns(Build)
def get_default_build(project_id, release_id):
    """Get the default build (of a release)."""
    project = get_project(project_id)
    release = get_release(project, release_id)
    return JsonResponse(get_build(release, release.defaultBuild))


@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<path:build_id>')
@app.route('/api/projects/<project_id>/releases/<release_id>/builds/byname/<path:build_id>')
@argument_doc('project_id', "The name or id of the project to get the build from.")
@argument_doc('release_id', "The name or id of the release to get the build from.")
@argument_doc('build_id', "The name or id of the build to get.")
@returns(Build)
def get_specific_build(project_id, release_id, build_id):
    """Get a build by id or name."""
    return JsonResponse(get_build(get_release(get_project(project_id), release_id), build_id))


@app.route('/api/projects/<project_id>/releases/<release_id>/builds/setdefaultbuild/<path:build_id>')
@argument_doc('project_id', "The name or id of the project to get the build from.")
@argument_doc('release_id', "The name or id of the release to get the build from.")
@argument_doc('build_id', "The name or id of the build to set as default.")
@returns(Project)
def set_default_build(project_id, release_id, build_id):
    """Set a default build of a release."""
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


@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<path:build_id>', methods=["PUT"])
@argument_doc('project_id', "The name or id of the project to update the build from.")
@argument_doc('release_id', "The name or id of the release to update the build from.")
@argument_doc('build_id', "The name or id of the build to update.")
@returns(Build)
@accepts(Build)
def update_build(project_id, release_id, build_id):
    """Update a build"""
    project = get_project(project_id)
    release = get_release(project, release_id)
    build = get_build(release, build_id)
    deserialize_that(read_request(), build)
    project.save()
    return JsonResponse(build)


@app.route('/api/projects/<project_id>/releases/<release_id>/builds/<path:build_id>', methods=["DELETE"])
@argument_doc('project_id', "The name or id of the project to delete the build from.")
@argument_doc('release_id', "The name or id of the release to delete the build from.")
@argument_doc('build_id', "The name or id of the build to delete.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Build), help_text='The remaining builds in the release'))
def delete_build(project_id, release_id, build_id):
    """Delete an individual build."""
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
@argument_doc('project_id', "The name or id of the project to get the components from.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Component)))
def get_components(project_id):
    """Get a list of components from a project"""
    project = get_project(project_id)
    return JsonResponse(project.components)


@app.route('/api/projects/<project_id>/components', methods=["POST"])
@argument_doc('project_id', "The name or id of the project to add a component to.")
@accepts(Component)
@returns(Component)
def add_component_for_project(project_id):
    """Add a component to a project."""
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
@argument_doc('project_id', "The name or id of the project to get the component from.")
@argument_doc('component_id', "The name or id of the component to get.")
@returns(Component)
def get_specific_component_for_project(project_id, component_id):
    """Get a component by name or id."""
    return JsonResponse(get_component(get_project(project_id), component_id))


@app.route('/api/projects/<project_id>/components/<component_id>', methods=["PUT"])
@argument_doc('project_id', "The name or id of the project to get the component from.")
@argument_doc('component_id', "The name or id of the component to update.")
@accepts(Component)
@returns(Component)
def update_component(project_id, component_id):
    """Update a component's properties"""
    project = get_project(project_id)
    component = get_component(project, component_id)
    deserialize_that(read_request(), component)
    project.save()
    return JsonResponse(component)


@app.route('/api/projects/<project_id>/components/<component_id>', methods=["DELETE"])
@argument_doc('project_id', "The name or id of the project to delete the component from.")
@argument_doc('component_id', "The name or id of the component to delete.")
@returns(mongoengine.ListField(mongoengine.EmbeddedDocumentField(Component), help_text="The remaining components in the project."))
def delete_component(project_id, component_id):
    """Delete a component from a project."""
    project = get_project(project_id)
    component = get_component(project, component_id)
    project.components.remove(component)
    project.save()
    return JsonResponse(project.components)


