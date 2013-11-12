__author__ = 'jcorbett'

from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testcaseReference import TestcaseReference

def create_project_reference(proj):
    """Create a Project Reference from the project instance

    :param proj: an instance of slickqaweb.model.project.Project
    :return: an instance of slickqaweb.model.projectReference.ProjectReference or None on error
    """
    if proj is None:
        return None
    assert isinstance(proj, Project)
    retval = ProjectReference()
    retval.id = proj.id
    retval.name = proj.name
    return retval

def create_testcase_reference(testcase):
    """Create a Testcase Reference from the Testcase instance

    :param testcase: an instance of slickqaweb.model.testcase.Testcase
    :return: an instance of slickqaweb.model.testcaseReference.TestcaseReference or None on error
    """
    if testcase is None:
        return None
    if not hasattr(testcase, 'id') or testcase.id is None:
        return None
    assert isinstance(testcase, Testcase)
    retval = TestcaseReference()
    retval.testcaseId = testcase.id
    retval.name = testcase.name
    if hasattr(testcase, 'automationId') and testcase.automationId is not None and testcase.automationId != '':
        retval.automationId = testcase.automationId
    if hasattr(testcase, 'automationKey') and testcase.automationKey is not None and testcase.automationKey != '':
        retval.automationKey = testcase.automationKey
    if hasattr(testcase, 'automationTool') and testcase.automationTool is not None and testcase.automationTool != '':
        retval.automationTool = testcase.automationTool
    return retval
