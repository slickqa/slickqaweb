from slickqaweb.app import app
from slickqaweb.model.project import Project


@app.route('/api/projects')
def get_projects():
    return [p for p in Project.objects]


@app.route('/api/projects/<project_name>')
def get_project_by_name(project_name):
    for p in Project.objects:
        if p.name == project_name:
            return p