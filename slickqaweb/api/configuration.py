__author__ = 'jcorbett'

from slickqaweb.model.configuration import Configuration
from slickqaweb.model.query import queryFor
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.app import app
from .standardResponses import JsonResponse, read_request
from flask import request
from bson import ObjectId

@app.route('/api/configurations')
def get_all_matching_configurations():
    return JsonResponse(queryFor(Configuration))


@app.route('/api/configurations', methods=['POST'])
def create_configuration():
    config = deserialize_that(read_request(), Configuration())
    config.save()
    return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>')
def get_configuration(configuration_id):
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>', methods=['PUT'])
def update_configuration(configuration_id):
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    if config is not None:
        config = deserialize_that(read_request(), config)
        config.save()
        return JsonResponse(config)


@app.route('/api/configurations/<configuration_id>', methods=['DELETE'])
def delete_configuration(configuration_id):
    config = Configuration.objects(id=ObjectId(configuration_id)).first()
    if config is not None:
        config.delete()
