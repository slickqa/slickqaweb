__author__ = 'jcorbett'

from slickqaweb.app import app
from slickqaweb.model.systemConfiguration import load_system_configuration_type, SystemConfigurationTypes, BaseSystemConfiguration
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request, g
from .standardResponses import JsonResponse, read_request
from bson import ObjectId

@app.route('/api/system-configuration')
def get_system_configurations():
    args = request.args
    type = BaseSystemConfiguration
    if args.has_key('config-type'):
        args = args.to_dict()
        if args['config-type'] in SystemConfigurationTypes:
            type = SystemConfigurationTypes[args['config-type']]
        else:
            args['configurationType'] = args['config-type']
        del args['config-type']
    return JsonResponse(queryFor(type, args))

@app.route('/api/system-configuration/<config_id>')
def get_system_configuration_by_id(config_id):
    type_name = load_system_configuration_type(ObjectId(config_id))
    type = BaseSystemConfiguration
    if type_name in SystemConfigurationTypes:
        type = SystemConfigurationTypes[type_name]
    return JsonResponse(type.objects(id=config_id).first())


@app.route('/api/system-configuration', methods=["POST"])
def add_system_configuration():
    data = read_request()
    if 'configurationType' not in data or data['configurationType'] not in SystemConfigurationTypes:
        return
    value = deserialize_that(data, SystemConfigurationTypes[data['configurationType']]())
    value.save()
    return JsonResponse(value)

@app.route('/api/system-configuration/<config_id>', methods=["PUT"])
def update_system_configuration(config_id):
    type_name = load_system_configuration_type(ObjectId(config_id))
    type = BaseSystemConfiguration
    if type_name in SystemConfigurationTypes:
        type = SystemConfigurationTypes[type_name]
    orig = type.objects(id=config_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)


# @app.route('/api/testcases', methods=["POST"])
# def add_testcase():
#     new_tc = deserialize_that(read_request(), Testcase())
#     if (new_tc.author is None or new_tc.author == "") and g.user is not None:
#         new_tc.author = g.user.full_name
#     new_tc.save()
#     return JsonResponse(new_tc)
#
# @app.route('/api/testcases/<testcase_id>', methods=["PUT"])
# def update_testcase(testcase_id):
#     orig = Testcase.objects(id=testcase_id).first()
#     deserialize_that(read_request(), orig)
#     orig.save()
#     return JsonResponse(orig)
