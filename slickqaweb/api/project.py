from slickqaweb.app import app
from slickqaweb.model.project import Project
from slickqaweb.model.serialize import deserialize_that
from flask import Response, request
from .standardResponses import JsonResponse

# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/projects')
def get_projects():
    return JsonResponse(Project.objects)

@app.route('/api/projects/<project_name>')
def get_project_by_name(project_name):
    return JsonResponse(Project.objects(name=project_name).first())


@app.route('/api/projects', methods=["POST"])
def add_project():
    new_project = deserialize_that(request.get_json(), Project())
    new_project.save()
    return JsonResponse(new_project)


@app.route('/api/projects/<project_name>', methods=["PUT"])
def update_project(project_name):
    orig = Project.objects(name=project_name).first()
    deserialize_that(request.get_json(), orig)
    orig.save()
    return JsonResponse(orig)

