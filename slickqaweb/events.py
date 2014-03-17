__author__ = 'jcorbett'

import logging
from json import dumps

from .app import app
from .model.serialize import serialize_this
from .model.slickLogEvent import SlickLogEvent, EventTypes

from kombu import producers
from flask import g
import sys



event_topic_mapping = {
}

class SlickEventError(Exception):
    pass

class Event(object):

    def __init__(self, typename):
        self.typename = typename
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
        super(CreateEvent, self).__init__(event_topic_mapping.get(created.__class__, created.__class__.__name__))
        self.created = dumps(serialize_this(created))
        try:
            logevent = SlickLogEvent(fieldType=self.typename, eventType=EventTypes.CREATED)
            if hasattr(created, 'id'):
                logevent.id = created.id
            if hasattr(created, 'name'):
                logevent.name = created.name
            if g.user is not None:
                logevent.user = g.user.full_name + " <" + g.user.email + ">"
            logevent.save()
        except:
            self.logger.warn("Error saving slick log event: ", exc_info=sys.exc_info())
        self.send()

    def get_prefix(self):
        return 'create'

    def get_content(self):
        return self.created


class UpdateEvent(Event):

    def __init__(self, before):
        super(UpdateEvent, self).__init__(event_topic_mapping.get(before.__class__, before.__class__.__name__))
        self.before = dumps(serialize_this(before))

    def after(self, after):
        if not app.config['events']:
            return
        self.after = dumps(serialize_this(after))
        try:
            logevent = SlickLogEvent(fieldType=self.typename, eventType=EventTypes.MODIFIED)
            if hasattr(after, 'id'):
                logevent.id = after.id
            if hasattr(after, 'name'):
                logevent.name = after.name
            if g.user is not None:
                logevent.user = g.user.full_name + " <" + g.user.email + ">"
            logevent.save()
        except:
            self.logger.warn("Error saving slick log event: ", exc_info=sys.exc_info())
        self.send()

    def get_prefix(self):
        return 'update'

    def get_content(self):
        # yes I know this is templated JSON, but we need to serialize the before and after right when we get them
        # so that they don't have any chance of changing on us.
        return '{{ "before": {}, "after": {}}}'.format(self.before, self.after)


class DeleteEvent(Event):

    def __init__(self, deleted):
        super(DeleteEvent, self).__init__(event_topic_mapping.get(deleted.__class__, deleted.__class__.__name__))
        self.deleted = dumps(serialize_this(deleted))
        try:
            logevent = SlickLogEvent(fieldType=self.typename, eventType=EventTypes.DELETED)
            if hasattr(deleted, 'id'):
                logevent.id = deleted.id
            if hasattr(deleted, 'name'):
                logevent.name = deleted.name
            if g.user is not None:
                logevent.user = g.user.full_name + " <" + g.user.email + ">"
            logevent.save()
        except:
            self.logger.warn("Error saving slick log event: ", exc_info=sys.exc_info())
        self.send()

    def get_prefix(self):
        return 'delete'

    def get_content(self):
        return self.deleted


