__author__ = 'jcorbett'

import logging
from kombu import Connection, Exchange

from .model.systemConfiguration.amqpSystemConfiguration import AMQPSystemConfiguration

class AMQPConnectionError(Exception):
    pass

def connect_to_amqp(sysconfig):
    """
    Connect to an AMQP Server, and return the connection and Exchange.
    :param sysconfig: The slickqaweb.model.systemConfiguration.amqpSystemConfiguration.AMQPSystemConfiguration instance
                      to use as the source of information of how to connect.
    :return: (connection, exchange) on success, exception on error
    """
    assert isinstance(sysconfig, AMQPSystemConfiguration)
    configuration = dict()
    configuration['AMQP'] = dict()
    if hasattr(sysconfig, 'hostname') and sysconfig.hostname is not None:
        configuration['AMQP']['hostname'] = sysconfig.hostname
    else:
        raise AMQPConnectionError(message="No hostname defined for AMQP connection.")
    if hasattr(sysconfig, 'port') and sysconfig.port is not None:
        configuration['AMQP']['port'] = sysconfig.port
    if hasattr(sysconfig, 'username') and sysconfig.username is not None:
        configuration['AMQP']['username'] = sysconfig.username
    if hasattr(sysconfig, 'password') and sysconfig.password is not None:
        configuration['AMQP']['password'] = sysconfig.password
    if hasattr(sysconfig, 'virtualHost') and sysconfig.virtualHost is not None:
        configuration['AMQP']['virtual host'] = sysconfig.virtualHost
    if hasattr(sysconfig, 'exchangeName') and sysconfig.exchangeName is not None:
        configuration['AMQP']['exchange'] = sysconfig.exchangeName
    else:
        raise AMQPConnectionError(message="No exchange defined for AMQP connection.")

    logger = logging.getLogger("slickqaweb.amqpcon.connect_to_amqp")

    url = str.format("amqp://{hostname}:{port}", **dict(list(configuration['AMQP'].items())))
    if 'virtual host' in configuration['AMQP'] and configuration['AMQP']['virtual host'] != '':
        url = str.format("{}/{}", url, configuration['AMQP']['virtual host'])
    logger.debug("AMQPConnection configured with url %s", url)
    exchange = Exchange(configuration['AMQP'].get('exchange', "amqp.topic"), type='topic', durable=True)
    logger.debug("AMQPConnection is using exchange %s", exchange)
    connection = None
    if 'username' in configuration['AMQP'] and 'password' in configuration['AMQP']:
        username = configuration['AMQP']['username']
        password = configuration['AMQP']['password']
        logger.debug("Using username %s and password %s to connect to AMQP Broker", username, password)
        connection = Connection(url, userid=username, password=password)
    else:
        connection = Connection(url)

    # typically connection connect on demand, but we want to flush out errors before proceeding
    connection.connect()
    exchange = exchange(connection)
    exchange.declare()
    return (connection, exchange)
