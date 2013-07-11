from slickqaweb.app import app
from slickqaweb.model.project import Project
from flask import Response, request


# TODO: add error handling. Not sure how to handle that yet.
@app.route('/api/projects')
def get_projects():
    return Response(Project.objects.to_json(), mimetype='application/json')


@app.route('/api/projects/<project_name>')
def get_project_by_name(project_name):
    return Response(Project.objects(name=project_name).first().to_json(), mimetype='application/json')


@app.route('/api/projects', methods=["POST"])
def add_project():
    new_project = Project(**request.get_json())
    new_project.save()
    return Response(new_project.to_json(), mimetype='application/json')


@app.route('/api/projects/<project_name>', methods=["PUT"])
def update_project(project_name):
    requested_change = request.get_json()
    formatted_change = update_dict_keys(requested_change)
    Project.objects(name=project_name).update_one(**formatted_change)
    if 'name' in requested_change:
        project_name = requested_change['name']
    return Response(Project.objects(name=project_name).first().to_json(), mimetype='application/json')


def update_keys(keys, prefix='set__'):
    return ['{}{}'.format(prefix, key) for key in keys]


def update_dict_keys(dictionary, prefix='set__'):
    assert isinstance(dictionary, dict)
    keys = dictionary.keys()
    values = dictionary.values()
    keys = update_keys(keys, prefix)
    return dict(zip(keys, values))