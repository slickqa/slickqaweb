import os

import logging

from slickqaweb.lib import decorate_all_class_methods, handle_exception
from slickqaweb.model.build import Build
from slickqaweb.model.project import Project
from slickqaweb.model.release import Release
from slickqaweb.model.result import Result
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testrun import Testrun


@decorate_all_class_methods(handle_exception)
class BaseConnector(object):

    def __init__(self):
        self.log = logging.getLogger(__name__)
        self.slick_url = os.environ.get("SLICK_URL", "https://slickqa.vivint.com")
        self.manager_url = os.environ.get("MANAGER_URL", "https://manager.smartlab.vivint.com/#!/?panelName={}")

    def project(self, project):
        # type: (Project) -> Project
        pass

    def release(self, release,  # type: Release
                project  # type: Project
                ):
        pass

    def build(self, build,  # type: Build
              release,  # type: Release
              project  # type: Project
              ):
        pass

    def testrun(self, testrun):
        # type: (Testrun) -> Testrun
        pass

    def testcase(self, testcase):
        # type: (Testcase) -> Testcase
        pass

    def result(self, result):
        # type: (Result) -> Result
        pass

    def status(self, result):
        # type: (Result) -> Result
        pass
