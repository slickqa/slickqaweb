__author__ = 'jcorbett'

import types
import re
import sys
import logging
import pprint

from flask import request


def is_not_provided(obj, attr_name):
    if not hasattr(obj, attr_name):
        return True
    if getattr(obj, attr_name) is None:
        return True
    if isinstance(getattr(obj, attr_name), (str,)) and getattr(obj, attr_name) == '':
        return True
    return False


def is_provided(obj, attr_name):
    return not is_not_provided(obj, attr_name)


object_id_regular_expression = re.compile(r"^[0-9a-f]{24}$", re.IGNORECASE)
def is_id(potential_id):
    """Determine if a string is an object ID."""
    return object_id_regular_expression.match(potential_id) is not None

def log_error(info=dict(), exc_info=None):
    logger = logging.getLogger('slickqaweb.utils.handle_error')

    # make sure we don't create an error of our own
    if info is None:
        info = dict()
    if exc_info is None:
        exc_info = sys.exc_info()
    try:
        # try adding request information, though we don't know for sure we are inside a request context
        if 'url' not in info and is_provided(request, 'url'):
            info['url'] = request.url
        if 'data' not in info and is_provided(request, 'data'):
            info['data'] = request.data
        if 'cookies' not in info and is_provided(request, 'cookies'):
            info['cookies'] = request.cookies
        if 'headers' not in info and is_provided(request, 'headers'):
            info['headers'] = request.headers
    except:
        pass

    if len(info) > 0:
        logger.error("An error occured during request:\n%s\n\n", pprint.pformat(info), exc_info=exc_info)
    else:
        logger.error("An error occured: ", exc_info=exc_info)
