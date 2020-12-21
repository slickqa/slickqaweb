from slickqaweb.lib.integrations.jira.lib import JIRA
from slickqaweb.model.project import Project
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testrun import Testrun
from slickqaweb.lib.integrations.base_connector import BaseConnector
from slickqaweb.lib.integrations.jira.lib import init_jira


class JiraConnect(BaseConnector):
    ENABLED = "JIRA_ENABLED"
    PROJECT_KEY = "JIRA_PROJECT_KEY"  # project
    VERSION_ID = "JIRA_VERSION_ID"  # release
    PLAN_KEY = "JIRA_PLAN_KEY"  # build
    EXECUTION_KEY = "JIRA_EXECUTION_KEY"  # testrun
    TEST_KEY = "JIRA_TEST_KEY"  # testcase
    TEST_RUN_ID = "JIRA_TEST_RUN_ID"  # result
    CREATE_MISSING_VERSION = "JIRA_CREATE_MISSING_VERSION"
    CREATE_MISSING_TEST = "JIRA_CREATE_MISSING_TEST"

    STATUS_MAPPING = {
        "PASS": "PASS",
        "FAIL": "FAIL",
        "PASSED_ON_RETRY": "PWKI",
        "NO_RESULT": "TODO",
        "RUNNING": "EXECUTING",
        "NOT_TESTED": "BLOCKED",
        "BROKEN_TEST": "BROKEN",
        "SKIPPED": "SKIPPED"
    }

    def __init__(self):
        super(JiraConnect, self).__init__()
        self.jira = init_jira()  # type: JIRA

    def project(self, project):
        if not project.attributes.get(self.PROJECT_KEY):
            jira_project = self.jira.project(project.name)
            if jira_project:
                project.attributes[self.PROJECT_KEY] = jira_project.get('key')
                return project

    def release(self, release, project):
        attributes = release.attributes
        if project and project.attributes.get(self.PROJECT_KEY):
            pass
        else:
            return
        if not attributes.get(self.VERSION_ID):
            if project.attributes.get(self.CREATE_MISSING_VERSION):
                version = self.jira.create_version(name=release.name, project=project.attributes.get(self.PROJECT_KEY))
                if version:
                    release.attributes[self.VERSION_ID] = version.get('id')
                    return release
                pass
            else:
                return

    def build(self, build, release, project):
        attributes = build.attributes

        if project and project.attributes.get(self.PROJECT_KEY):
            pass
        else:
            return
        if not attributes.get(self.PLAN_KEY):
            plan = self.jira.create_test_plan(project=project.attributes.get(self.PROJECT_KEY),
                                              summary="{}.{}".format(release.name, build.name),
                                              description="{}}/build-report/{}/{}/{}".format(self.slick_url,
                                                                                             project.name,
                                                                                             release.name,
                                                                                             build.name),
                                              issuetype={'name': 'Test Plan'},
                                              customfield_11823={"value": "Not Applicable"},
                                              components=[{"name": "Test Case"}])
            if plan:
                build.attributes[self.PLAN_KEY] = plan.key
                return build

    def testrun(self, testrun):
        from slickqaweb.api.project import get_release, get_build
        project = Project.objects(id=testrun.project.id).only('attributes').first()
        if project and project.attributes.get(self.PROJECT_KEY):
            pass
        else:
            return
        if project.attributes.get(self.PROJECT_KEY) and not testrun.attributes.get(self.EXECUTION_KEY):
            execution = self.jira.create_execution(project=project.attributes.get(self.PROJECT_KEY),
                                                   summary="{}.{} - {}".format(testrun.release.name, testrun.build.name, testrun.name),
                                                   description="{}}/testruns/{}".format(self.slick_url, testrun.id),
                                                   issuetype={'name': 'Test Execution'},
                                                   customfield_11823={"value": "Not Applicable"},
                                                   components=[{"name": "Test Case"}])
            if execution:
                testrun.attributes[self.EXECUTION_KEY] = execution.key
                build = get_build(get_release(Project.objects(id=testrun.project.id).only('releases').first(), testrun.release.releaseId), testrun.build.buildId)
                if build and build.attributes.get(self.PLAN_KEY):
                    self.log.debug("Build {} has {} set!".format(build.name, self.PLAN_KEY))
                    self.jira.add_test_execution(plan_key=build.attributes.get(self.PLAN_KEY), execution_key=execution.key)
                return testrun

    def testcase(self, testcase):
        attributes = testcase.attributes
        if not attributes.get(self.TEST_KEY):
            tests = self.jira.search_issues(jql_str='"Automation ID" = "{}"'.format(testcase.automationId))
            if tests:
                testcase.attributes[self.TEST_KEY] = tests[0].key
                return testcase
            else:
                project = Project.objects(id=testcase.project.id).only('attributes').first()
                if project and project.attributes.get(self.CREATE_MISSING_TEST):
                    # CREATE MISSING TEST IN PROJECT AND SET TEST_KEY on testcase
                    # testcase.attributes[self.TEST_KEY] = "THE TEST KEY WE GET"
                    return testcase

    def result(self, result):
        from slickqaweb.api.project import get_release, get_build
        attributes = result.attributes
        if attributes.get(self.TEST_RUN_ID):
            self.jira.update_test_run_status(test_run_id=attributes.get(self.TEST_RUN_ID), status=result.status)
        else:
            testcase = Testcase.objects(automationId=result.testcase.automationId).first()
            if testcase and testcase.attributes.get(self.TEST_KEY):
                self.log.debug("Testcase {} has {} set!".format(testcase.automationId, self.TEST_KEY))
            else:
                testcase = self.testcase(testcase)
                if testcase:
                    testcase.save()
                else:
                    return
            testrun = Testrun.objects(id=result.testrun.testrunId).first()
            if testrun and testrun.attributes.get(self.EXECUTION_KEY):
                self.log.debug("Testrun {} has {} set!".format(testrun.name, self.EXECUTION_KEY))
                test = self.jira.add_test_to_execution(execution_key=testrun.attributes.get(self.EXECUTION_KEY), test_key=testcase.attributes.get(self.TEST_KEY))
                if test:
                    result.attributes[self.TEST_RUN_ID] = str(test.get('id'))
                else:
                    return
            else:
                return
            build = get_build(get_release(Project.objects(id=result.project.id).only('releases').first(), result.release.releaseId), result.build.buildId)
            if build and build.attributes.get(self.PLAN_KEY):
                self.log.debug("Build {} has {} set!".format(build.name, self.PLAN_KEY))
                self.jira.add_test_to_plan(plan_key=build.attributes.get(self.PLAN_KEY), test_key=testcase.attributes.get(self.TEST_KEY))
            else:
                return

            return result

    def status(self, result):
        if result.attributes.get(self.TEST_RUN_ID):
            status = result.status
            if result.runstatus == "RUNNING":
                status = "RUNNING"
            try:
                comment = '*SLICK LINK:* {}\n' \
                          '*HOSTNAME:* {}\n' \
                          '*REQUIREMENTS:* {}'.format('[{}|{}/testruns/{}?result={}&all=true]'.format(result.testcase.name, self.slick_url, result.testrun.testrunId, result.testcase.testcaseId),
                                                        result.hostname,
                                                        ", ".join(result.requirements))
                if result.status == "FAIL" or result.status == "BROKEN_TEST":
                    comment += '\n*ERROR MESSAGE:*\n' \
                               '{{code}}{}{{code}}'.format(result.reason)
                if int(result.attributes.get('retry_count', 0)) > 0:
                    retry_logs = ["_{}_\n{{code}}{}{{code}}".format(x.entryTime, x.message) for x in result.log if x.level == "INFO" and x.loggerName == "slick.note"]
                    if retry_logs:
                        comment += "\n*RETRY REASONS ({}):*\n{}".format(len(retry_logs), "\n".join(retry_logs))
                self.jira.update_test_run(test_run_id=result.attributes.get(self.TEST_RUN_ID), data=dict(status=self.STATUS_MAPPING.get(status, "BROKEN"),
                                                                                                         comment=comment))
            except:
                pass
