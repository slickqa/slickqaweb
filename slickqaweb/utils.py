__author__ = 'jcorbett'

import types
import re


def is_not_provided(obj, attr_name):
    if not hasattr(obj, attr_name):
        return True
    if getattr(obj, attr_name) is None:
        return True
    if isinstance(getattr(obj, attr_name), types.StringTypes) and getattr(obj, attr_name) == '':
        return True
    return False


def is_provided(obj, attr_name):
    return not is_not_provided(obj, attr_name)


object_id_regular_expression = re.compile(r"^[0-9a-f]{24}$", re.IGNORECASE)
def is_id(potential_id):
    """Determine if a string is an object ID."""
    return object_id_regular_expression.match(potential_id) is not None


