__author__ = 'jcorbett'

from slickqaweb.app import app
from slickqaweb.model.dashboards import load_dashboard_type, load_dashboard_type_by_name, DashboardTypes, BaseDashboard
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request, g
from .standardResponses import JsonResponse, read_request
from bson import ObjectId
from slickqaweb.utils import is_id


@app.route('/api/dashboards')
def get_dashboards():
    args = request.args
    type = BaseDashboard
    if args.has_key('config-type'):
        args = args.to_dict()
        if args['config-type'] in DashboardTypes:
            type = DashboardTypes[args['config-type']]
        else:
            args['configurationType'] = args['config-type']
        del args['config-type']
    return JsonResponse(queryFor(type, args))

def load_dashboard(id_or_name):
    type_name = None
    query = {}
    if is_id(id_or_name):
        type_name = load_dashboard_type(ObjectId(id_or_name))
        query['id'] = id_or_name
    else:
        type_name = load_dashboard_type_by_name(id_or_name)
        query['name'] = id_or_name
    type = BaseDashboard
    if type_name in DashboardTypes:
        type = DashboardTypes[type_name]
    return type.objects(**query).first()

@app.route('/api/dashboards/<config_id>')
def get_dashboard_by_id(config_id):
    dashboard = load_dashboard(config_id)
    return JsonResponse(dashboard)

@app.route('/api/dashboards', methods=["POST"])
def add_dashboard():
    data = read_request()
    if 'configurationType' not in data or data['configurationType'] not in DashboardTypes:
        return
    value = deserialize_that(data, DashboardTypes[data['configurationType']]())
    value.save()
    return JsonResponse(value)

@app.route('/api/dashboards/<config_id>', methods=["PUT"])
def update_dashboard(config_id):
    orig = load_dashboard(config_id)
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)


