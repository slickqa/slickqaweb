__author__ = 'jcorbett'

from flask import Response
from slickqaweb.model.serialize import serialize_this
from json import dumps

def JsonResponse(obj):
    if obj is None:
        return Response(status=404)
    return Response(dumps(serialize_this(obj)),
                    content_type='application/json',
                    headers={'Cache-Control': 'no-store'})
