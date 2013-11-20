__author__ = 'jcorbett'

import types

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


