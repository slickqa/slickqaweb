__author__ = 'Jared'

from slickqaweb.app import app
from slickqaweb.model.reservable import Reservable
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from flask import request
from .standardResponses import JsonResponse, read_request
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField

add_resource('/reservables', 'Add, update, and delete reservables.')


@app.route('/api/reservables')
@standard_query_parameters
@returns(ListField(ReferenceField(Reservable)))
def get_reservables():
    """Query for existing reservables."""
    # for backwards compatibility
    args = request.args
    if args.has_key('projectid'):
        args = args.to_dict()
        args['project.id'] = request.args['projectid']
        del args['projectid']
    return JsonResponse(queryFor(Reservable, args))

@app.route('/api/reservables/reserve/<reservable_name>')
@argument_doc('reservable_name', 'The name of the reservable object you want to reserve')
@returns(ListField(Reservable))
def reserve_reservables(reservable_name):
    """Get reservable and mark in_use"""

    response = Reservable.objects(name=reservable_name, in_use=False).update(in_use=True)
    if response:
        return JsonResponse(Reservable.objects(name=reservable_name, in_use=True))
    return JsonResponse(None)

@app.route('/api/reservables/release/<reservable_name>')
@argument_doc('reservable_name', 'The name of the reservable object you want to release')
@returns(ListField(Reservable))
def release_reservables(reservable_name):
    """Get reservable and mark in_use"""

    response = Reservable.objects(name=reservable_name, in_use=True).update(in_use=False)
    if response:
        return JsonResponse(Reservable.objects(name=reservable_name, in_use=False))
    return JsonResponse(None)

@app.route('/api/reservables/<reservable_id>')
@argument_doc('reservable_id', 'The id of the reservable (string representation of BSON ObjectId).')
def get_reservable_by_id(reservable_id):
    """Get a specific reservable by it's id."""
    return JsonResponse(Reservable.objects(id=reservable_id).first())


@app.route('/api/reservables', methods=["POST"])
@accepts(Reservable)
@returns(Reservable)
def add_reservable():
    """Add a new reservable."""
    new_rsrvbl = deserialize_that(read_request(), Reservable())
    #if (new_rsrvbl.createdBy is None or new_rsrvbl.createdBy == "") and g.user is not None:
    #    new_rsrvbl.createdBy = g.user.full_name
    new_rsrvbl.save()
    return JsonResponse(new_rsrvbl)

@app.route('/api/reservables/<reservable_id>', methods=["PUT"])
@accepts(Reservable)
@returns(Reservable)
@argument_doc('reservable_id', 'The id of the reservable (string representation of BSON ObjectId).')
@note("You only need to specify the properties that need updating.")
def update_reservable(reservable_id):
    """Update an existing reservable's properties."""
    orig = Reservable.objects(id=reservable_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)