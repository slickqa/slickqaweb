import os

from jira import JIRA as JiraWithoutXRay

JIRA_URL = os.environ.get('JIRA_URL', 'https://jira.vivint.com')


# TODO: Have this live in qetools
class JIRA(JiraWithoutXRay):

    @property
    def xray_base_url(self):
        return "{}/rest/raven/1.0/api".format(JIRA_URL)

    def update_test_run_status(self, test_run_id, status):
        return self._session.put("{}/testrun/{}/status".format(self.xray_base_url, test_run_id), params=dict(status=status))


def init_jira():
    if os.environ.get('JIRA_CREDENTIALS'):
        jira_credentials = os.getenv('JIRA_CREDENTIALS').split(':')
        basic_auth = (jira_credentials[0], jira_credentials[1])

        return JIRA(server=JIRA_URL, basic_auth=basic_auth)


jira = init_jira()
