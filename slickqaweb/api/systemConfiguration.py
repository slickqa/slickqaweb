__author__ = 'jcorbett'

from slickqaweb.app import app
from slickqaweb.model.systemConfiguration import load_system_configuration_type, SystemConfigurationTypes, BaseSystemConfiguration
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request
from .standardResponses import JsonResponse, read_request
from bson import ObjectId
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, EmbeddedDocumentField, ReferenceField

sysconfig_resource = add_resource("/system-configuration", "Create, modify, and delete slick system configurations.")

sysconfig_resource.subtypes[BaseSystemConfiguration] = []
for system_configuration_type in SystemConfigurationTypes.values():
    sysconfig_resource.subtypes[BaseSystemConfiguration].append(system_configuration_type)


@app.route('/api/system-configuration')
@standard_query_parameters
@argument_doc('config-type', 'A shortcut for querying for the configuration type.', paramtype='query')
@note("This method returns other types, but the values in BaseSystemConfiguration are guaranteed to be common.")
@returns(ListField(ReferenceField(BaseSystemConfiguration)))
def get_system_configurations():
    """Find various system configuration types."""
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
@argument_doc('config_id', 'The id for the system configuration (the string representation of the BSON ObjectId).')
@returns(BaseSystemConfiguration)
@note("This method returns other types, but the values in BaseSystemConfiguration are guaranteed to be common.")
def get_system_configuration_by_id(config_id):
    """Get a specific configuration using it's id"""
    type_name = load_system_configuration_type(ObjectId(config_id))
    type = BaseSystemConfiguration
    if type_name in SystemConfigurationTypes:
        type = SystemConfigurationTypes[type_name]
    return JsonResponse(type.objects(id=config_id).first())


@app.route('/api/system-configuration', methods=["POST"])
@accepts(BaseSystemConfiguration)
@returns(BaseSystemConfiguration)
@note("This method accepts and returns other system configuration types, but the values in BaseSystemConfiguration are guaranteed to be common.")
def add_system_configuration():
    """Add a new system configuration"""
    data = read_request()
    if 'configurationType' not in data or data['configurationType'] not in SystemConfigurationTypes:
        return
    value = deserialize_that(data, SystemConfigurationTypes[data['configurationType']]())
    value.save()
    return JsonResponse(value)

@app.route('/api/system-configuration/<config_id>', methods=["PUT"])
@note("This method accepts and returns other system configuration types, but the values in BaseSystemConfiguration are guaranteed to be common.")
@accepts(BaseSystemConfiguration)
@returns(BaseSystemConfiguration)
@argument_doc('config_id', 'The id for the system configuration (the string representation of the BSON ObjectId).')
def update_system_configuration(config_id):
    """Update a specific system configuration"""
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
