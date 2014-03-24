__author__ = 'jcorbett'

import glob
import os
import datetime

# this little gem will import every .py file in this directory
# the advantage is that we can just import slickqaweb.model.dashboards and all the
# types will be added to types.allTypes

dashboard_types_path = os.path.dirname(__file__)
dashboard_types_path_length = len(dashboard_types_path)

modules = []
for name in glob.glob(os.path.join(dashboard_types_path,'*.py')):
    if not name.endswith('__init__.py'):
        modules.append(name[dashboard_types_path_length + 1:-3])

modules.sort()
for module in modules:
    __import__("slickqaweb.model.dashboards", globals(), locals(), fromlist=[module,])

from .types import AllTypes as DashboardTypes

import mongoengine
import bson

class BaseDashboard(mongoengine.Document):
    meta = {'collection': 'dashboards'}
    name = mongoengine.StringField(required=True, unique=True)
    lastUpdated = mongoengine.DateTimeField(required=True, default=datetime.datetime.now)
    dashboardType = mongoengine.StringField()


def load_dashboard_type(id):
    assert isinstance(id, bson.ObjectId)
    return BaseDashboard.objects(id=id).first().configurationType

def load_dashboard_type_by_name(name):
    return BaseDashboard.objects(name=name).first().configurationType
