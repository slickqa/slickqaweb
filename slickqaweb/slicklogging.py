__author__ = 'jcorbett'

import logging
import logging.handlers
import sys



def initialize_logging(config):
    handlers = []
    formatter = logging.Formatter(fmt=config["LOG_FORMAT"], datefmt=config["LOG_DATE_FORMAT"])
    root_logger = logging.getLogger()
    exc_info = None
    try:
        handlers.append(logging.handlers.WatchedFileHandler(config["LOG_PATH"]))
    except:
        handlers = [logging.StreamHandler(),]
        exc_info = sys.exc_info()
    root_logger.setLevel(config["LOG_LEVEL"])
    for handler in root_logger.handlers:
        root_logger.removeHandler(handler)
    for handler in handlers:
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
    if exc_info is not None:
        logger = logging.getLogger("slickqaweb.logging.initialize_logging")
        logger.warning("Unable to write to log file %s: ", config["LOG_PATH"], exc_info=exc_info)
