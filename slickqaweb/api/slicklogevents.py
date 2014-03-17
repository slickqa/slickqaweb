__author__ = 'jcorbett'

from .standardResponses import JsonResponse, read_request
from slickqaweb.model.slickLogEvent import SlickLogEvent
from slickqaweb.app import app
from slickqaweb.model.query import queryFor
from slickqaweb.model.serialize import deserialize_that

from flask import g


@app.route("/api/slicklogevents")
def get_events():
    return JsonResponse(queryFor(SlickLogEvent))

@app.route("/api/slicklogevents", methods=["POST"])
def create_event():
    new_log = deserialize_that(read_request(), SlickLogEvent())
    # set the user if one is logged in
    if (new_log.user is None or new_log.user == "" or new_log.user == "Anonymous") and g.user is not None:
        new_log.user = g.user.full_name + " <" + g.user.email + ">"
    new_log.save()
    return JsonResponse(new_log)
