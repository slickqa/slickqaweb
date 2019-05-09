from mongoengine import *


class Reservable(Document):
    name = StringField()
    in_use = BooleanField(default=False)
    meta = {'collection': 'reservables'}
