__author__ = 'jcorbett'

from slickqaweb.model.configuration import Configuration
from slickqaweb.model.query import queryFor
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.app import app
from .standardResponses import JsonResponse, read_request
from flask import request
from bson import ObjectId
import mongoengine
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters

add_resource("/configurations", "Add, edit or remove configurations of different types.")

@app.route('/api/configurations')
@standard_query_parameters
@returns(mongoengine.ListField(mongoengine.ReferenceField(Configuration)))
def get_all_matching_configurations():
    """Query for and find configurations (like Environments)."""
    return JsonResponse(queryFor(Configuration))


@app.route('/api/configurations', methods=['POST'])
@accepts(Configuration)
@returns(Configuration)
def create_configuration():
    """Create a new configuration"""
    config = deserialize_that(read_request(), Configuration())
    config.save()
    return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>')
@argument_doc('configuration_id', "The id of the configuration.")
@returns(Configuration)
def get_configuration(configuration_id):
    """Get a specific configuration by id."""
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>', methods=['PUT'])
@argument_doc('configuration_id', "The id of the configuration to update.")
@accepts(Configuration)
def update_configuration(configuration_id):
    """Update a configuration"""
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    if config is not None:
        config = deserialize_that(read_request(), config)
        config.save()
        return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>', methods=['DELETE'])
@argument_doc('configuration_id', "The id of the configuration to delete.")
def delete_configuration(configuration_id):
    """Remove a configuration"""
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    if config is not None:
        config.delete()
