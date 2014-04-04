__author__ = 'jcorbett'

from .standardResponses import JsonResponse, read_request
from slickqaweb.model.slickLogEvent import SlickLogEvent
from slickqaweb.app import app
from slickqaweb.model.query import queryFor
from slickqaweb.model.serialize import deserialize_that
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField

from flask import g

add_resource("/slicklogevents", "Get slick audit log events.")


@app.route("/api/slicklogevents")
@standard_query_parameters
@returns(ListField(ReferenceField(SlickLogEvent)))
def get_events():
    """Query for slick log events."""
    return JsonResponse(queryFor(SlickLogEvent))

@app.route("/api/slicklogevents", methods=["POST"])
@accepts(SlickLogEvent)
@returns(SlickLogEvent)
def create_event():
    """Add a new slick log event."""
    new_log = deserialize_that(read_request(), SlickLogEvent())
    # set the user if one is logged in
    if (new_log.user is None or new_log.user == "" or new_log.user == "Anonymous") and g.user is not None:
        new_log.user = g.user.full_name + " <" + g.user.email + ">"
    new_log.save()
    return JsonResponse(new_log)
