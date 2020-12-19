import logging


def decorate_all_class_methods(decorator):
    def decorate(cls):
        for attr in cls.__dict__:
            if callable(getattr(cls, attr)):
                setattr(cls, attr, decorator(getattr(cls, attr)))
        return cls

    return decorate


def handle_exception(func):

    def inner_function(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger = logging.getLogger('slickqaweb.lib.integrations.exceptions.{}'.format(func.__name__))
            logger.exception(e)

    return inner_function
