import os

from jira import JIRA as JiraWithoutXRay
import logging

from slickqaweb.lib import decorate_all_class_methods, handle_exception

logger = logging.getLogger('slickqaweb.lib.jira_util')

JIRA_URL = os.environ.get('JIRA_URL', 'https://jira.vivint.com')


# TODO: Have this live in qetools
@decorate_all_class_methods(handle_exception)
class JIRA(JiraWithoutXRay):

    @property
    def xray_base_url(self):
        return "https://jira.vivint.com/rest/raven/1.0/api"

    def test_plan_executions(self, test_plan_key):
        response = self._session.get("{}/testplan/{}/testexecution".format(self.xray_base_url, test_plan_key))
        if response.ok:
            return response.json()

    def test_plan_tests(self, test_plan_key):
        response = self._session.get("{}/testplan/{}/test".format(self.xray_base_url, test_plan_key))
        if response.ok:
            return response.json()

    def create_test_plan(self, *args, **kwargs):
        return self.create_issue(*args, **kwargs)

    def add_test_executions(self, test_plan_key, execution_keys):
        response = self._session.post("{}/testplan/{}/testexecution".format(self.xray_base_url, test_plan_key), json={"add": execution_keys})
        if response.ok:
            return response.json()

    def add_test_execution(self, plan_key, execution_key):
        response = self._session.post("{}/testplan/{}/testexecution".format(self.xray_base_url, plan_key), json={"add": [execution_key]})
        if response.ok:
            test_plan = self.test_plan_executions(plan_key)
            if test_plan:
                return next(x for x in test_plan if x.get('key') == execution_key)

    def add_tests_to_plan(self, plan_key, test_keys):
        response = self._session.post("{}/testplan/{}/test".format(self.xray_base_url, plan_key), json={"add": test_keys})
        if response.ok:
            return response.json()

    def add_test_to_plan(self, plan_key, test_key):
        response = self._session.post("{}/testplan/{}/test".format(self.xray_base_url, plan_key), json={"add": [test_key]})
        if response.ok:
            test_plan = self.test_plan_tests(plan_key)
            if test_plan:
                return next(x for x in test_plan if x.get('key') == test_key)

    # TODO: Create a TestExecution class following the model defined in the JIRA library we are using
    def execution(self, execution_key):
        response = self._session.get("{}/testexec/{}/test".format(self.xray_base_url, execution_key))
        if response.ok:
            return response.json()

    def create_execution(self, *args, **kwargs):
        return self.create_issue(*args, **kwargs)

    def add_tests_to_execution(self, execution_key, test_keys):
        response = self._session.post("{}/testexec/{}/test".format(self.xray_base_url, execution_key), json={"add": test_keys})
        if response.ok:
            return response.json()

    def add_test_to_execution(self, execution_key, test_key):
        response = self._session.post("{}/testexec/{}/test".format(self.xray_base_url, execution_key), json={"add": [test_key]})
        if response.ok:
            execution = self.execution(execution_key)
            if execution:
                return next(x for x in execution if x.get('key') == test_key)

    def update_test_run(self, test_run_id, data):
        return self._session.put("{}/testrun/{}".format(self.xray_base_url, test_run_id), json=data)

    def update_test_run_status(self, test_run_id, status):
        return self.update_test_run(test_run_id=test_run_id, data={"status": status})


def init_jira():
    if os.environ.get('JIRA_CREDENTIALS'):
        jira_credentials = os.getenv('JIRA_CREDENTIALS').split(':')
        basic_auth = (jira_credentials[0], jira_credentials[1])

        return JIRA(server=JIRA_URL, basic_auth=basic_auth)
