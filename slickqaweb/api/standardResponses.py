__author__ = 'jcorbett'

from flask import Response, request
from slickqaweb.model.serialize import serialize_this
from ujson import dumps
from ujson import loads

def JsonResponse(obj):
    if obj is None:
        return Response(status=404)
    return Response(dumps(serialize_this(obj)),
                    content_type='application/json',
                    headers={'Cache-Control': 'no-store'})

def read_request():
    return loads(request.data)
