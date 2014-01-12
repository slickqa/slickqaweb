__author__ = 'jcorbett'

import logging
from json import dumps

from .app import app
from .model.serialize import serialize_this

from kombu import producers



event_topic_mapping = {
}

class SlickEventError(Exception):
    pass

class Event(object):

    def __init__(self, typename):
        self.logger = logging.getLogger("slickqaweb.events.Event")
        self.topic = "{}.{}".format(self.get_prefix(), typename)
        self.logger.debug("Initializing event for topic '%s'", self.topic)

    def get_prefix(self):
        message = "Programing Error: get_prefix called on Event base class, probably means someone just used the Event class, instead of CreateEvent, UpdateEvent, or DeleteEvent."
        self.logger.error(message)
        raise SlickEventError(message=message)

    def get_content(self):
        message = "Programing Error: get_content called on Event base class, probably means someone just used the Event class, instead of CreateEvent, UpdateEvent, or DeleteEvent."
        self.logger.error(message)
        raise SlickEventError(message=message)

    def send(self):
        if app.config['events']:
            with producers[app.config['event_connection']].acquire(block=True) as producer:
                self.logger.info("Sending AMQP message (event) to routing key (topic) '%s'", self.topic)
                producer.publish(self.get_content(),
                                 exchange=app.config['event_exchange'],
                                 routing_key=self.topic,
                                 content_type="application/json",
                                 content_encoding="UTF-8")


class CreateEvent(Event):

    def __init__(self, created):
        if not app.config['events']:
            return
        super(CreateEvent, self).__init__(event_topic_mapping.get(created.__class__, created.__class__.__name__))
        self.created = dumps(serialize_this(created))
        self.send()

    def get_prefix(self):
        return 'create'

    def get_content(self):
        return self.created


class UpdateEvent(Event):

    def __init__(self, before):
        if not app.config['events']:
            return
        super(UpdateEvent, self).__init__(event_topic_mapping.get(before.__class__, before.__class__.__name__))
        self.before = dumps(serialize_this(before))

    def after(self, after):
        if not app.config['events']:
            return
        self.after = dumps(serialize_this(after))
        self.send()

    def get_prefix(self):
        return 'update'

    def get_content(self):
        # yes I know this is templated JSON, but we need to serialize the before and after right when we get them
        # so that they don't have any chance of changing on us.
        return '{{ "before": {}, "after": {}}}'.format(self.before, self.after)


class DeleteEvent(Event):

    def __init__(self, deleted):
        if not app.config['events']:
            return
        super(DeleteEvent, self).__init__(event_topic_mapping.get(deleted.__class__, deleted.__class__.__name__))
        self.deleted = dumps(serialize_this(deleted))
        self.send()

    def get_prefix(self):
        return 'delete'

    def get_content(self):
        return self.deleted


