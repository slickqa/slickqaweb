__author__ = 'jcorbett'

import glob
import os

# this little gem will import every .py file in this directory
# the advantage is that we can just import slickqaweb.model.systemConfiguration and all the
# types will be added to types.allTypes

compile_steps_path = os.path.dirname(__file__)
compile_steps_path_length = len(compile_steps_path)

modules = []
for name in glob.glob(os.path.join(compile_steps_path,'*.py')):
    if not name.endswith('__init__.py'):
        modules.append(name[compile_steps_path_length + 1:-3])

modules.sort()
for module in modules:
    __import__("slickqaweb.model.systemConfiguration", globals(), locals(), fromlist=[module,])

from .types import AllTypes as SystemConfigurationTypes

import mongoengine
import bson

class BaseSystemConfiguration(mongoengine.Document):
    meta = {'collection': 'system-configurations'}
    configurationType = mongoengine.StringField()

    dynamic_types = {
        'typeName': mongoengine.StringField()
    }


def load_system_configuration_type(id):
    assert isinstance(id, bson.ObjectId)
    return BaseSystemConfiguration.objects(id=id).first().configurationType


