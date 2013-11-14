__author__ = 'jcorbett'

from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testcaseReference import TestcaseReference
from slickqaweb.model.component import Component
from slickqaweb.model.componentReference import ComponentReference
from slickqaweb.model.release import Release
from slickqaweb.model.releaseReference import ReleaseReference
from slickqaweb.model.build import Build
from slickqaweb.model.buildReference import BuildReference

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

def create_component_reference(component):
    """Create a Component Reference from a Component

    This method is mostly for forwards compatibility since a component and it's reference are
    identical except the component has a description field that is almost never filled in.

    :param component: an instance of slickqaweb.model.component.Component
    :return: an instance of slickqaweb.model.componentReference.ComponentReference
    """
    if component is None:
        return None
    assert isinstance(component, Component)
    retval = ComponentReference()
    retval.id = component.id
    retval.name = component.name
    if hasattr(component, 'code') and component.code is not None and component.code != '':
        retval.code = component.code

    return retval

def create_release_reference(release):
    """Create a ReleaseReference instance populated from the provided release

    :param release: An instance of slickqaweb.model.release.Release
    :return: an instance of slickqaweb.model.releaseReference.ReleaseReference
    """
    if release is None:
        return None
    assert isinstance(release, Release)
    retval = ReleaseReference()
    retval.releaseId = release.id
    retval.name = release.name
    return retval

def create_build_reference(build):
    """Create a BuildReference instance populated from the provided build

    :param build: An instance of slickqaweb.model.release.Build
    :return: an instance of slickqaweb.model.buildReference.BuildReference
    """
    if build is None:
        return None
    assert isinstance(build, Build)
    retval = BuildReference()
    retval.buildId = build.id
    retval.name = build.name
    return retval

