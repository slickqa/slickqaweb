__author__ = 'jcorbett'

from slickqaweb.app import app
from slickqaweb.model.userAccount import UserAccount
from .standardResponses import JsonResponse, read_request
from slickqaweb.model.query import queryFor
from flask import Response
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField
from slickqaweb.model.serialize import deserialize_that
from slickqaweb import events

add_resource('/users', 'Access user accounts.')


@app.route("/api/users")
@standard_query_parameters
@returns(ListField(ReferenceField(UserAccount)))
def get_users():
    """Query for user accounts."""
    return JsonResponse(queryFor(UserAccount))


@app.route("/api/users/<email>")
@returns(UserAccount)
@argument_doc('email', "The email address of the user you wish to recieve the account for, or current for the currently logged in user.")
@note("If you supply 'current' as the user's email address it will return the currently logged in user's account, or a 404 if no one is logged in.")
def get_current_user(email):
    """Retrieve a user account by their email address."""
    if "current" == email:
        return Response(status=404)
    else:
        return(JsonResponse(UserAccount.objects(email=email).first()))


@app.route("/api/users/<email>", methods=['PUT'])
@returns(UserAccount)
@accepts(UserAccount)
@argument_doc('email', "The email address of the user you wish to recieve the account for, or current for the currently logged in user.")
def update_user_account(email):
    """Update a user's account info."""
    orig = UserAccount.objects(email=email).first()
    if orig is None:
        return Response(status=404)
    update_event = events.UpdateEvent(before=orig)
    deserialize_that(read_request(), orig)
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)



