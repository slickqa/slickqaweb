from .configuration import Configuration
from .component import Component
from .dataDrivenProperty import DataDrivenProperty
from .release import Release
from .build import Build
from mongoengine import *
import bson
import datetime


class Project(Document):
    attributes = DictField()
    automationTools = ListField(StringField())
    components = ListField(EmbeddedDocumentField(Component))
    configuration = ReferenceField(Configuration)
    dataDrivenProperties = ListField(EmbeddedDocumentField(DataDrivenProperty))
    defaultRelease = StringField()
    description = StringField()
    lastUpdated = DateTimeField()
    name = StringField(required=True)
    releases = ListField(EmbeddedDocumentField(Release))
    tags = ListField(StringField())
    meta = {'collection': 'projects'}

    @staticmethod
    def lookup_project_release_build_ids(project_name, release_name, build_name, create_if_missing=False):
        """Lookup and return a tuple containing project release and build id given their names.
        :param project_name: The name of the project to look up
        :type project_name: str
        :param release_name: The name of the release to look up
        :type release_name: str
        :param build_name: The name of the build to look up
        :type build_name: str
        :param create_if_missing: Create any objects that are missing
        :type create_if_missing: bool
        :return: A tuple containing the IDs of anything found
        :rtype: tuple[bson.ObjectId]
        """
        # Quick lookup
        project_id = None
        release_id = None
        build_id = None

        try:
            if project_name is not None and release_name is not None and build_name is not None:
                quick_lookup_answer = Project.objects.aggregate({'$match': {'name': project_name}},
                                                                {'$unwind': '$releases'},
                                                                {'$unwind': '$releases.builds'},
                                                                {'$match': {'releases.name': release_name,
                                                                            'releases.builds.name': build_name}},
                                                                {'$project': {'_id': 1, 'name': 1, 'releases.name': 1,
                                                                              'releases.id': 1,
                                                                              'releases.builds.name': 1,
                                                                              'releases.builds.id': 1}}).next()
                # the above would have generated a StopIteration if any item wasn't found
                project_id = quick_lookup_answer['_id']
                release_id = quick_lookup_answer['releases']['id']
                build_id = quick_lookup_answer['releases']['builds']['id']
        except StopIteration:
            pass
        if (project_id is None or release_id is None or build_id is None) and project_name is not None:
            project = Project.objects(name=project_name).first()
            release = None
            build = None

            if project is None and create_if_missing:
                # create it all!
                project = Project()
                project.name = project_name
                project.releases = []
                if release_name is not None:
                    release = Release()
                    release.name = release_name
                    release.id = bson.ObjectId()
                    release_id = release.id
                    release.builds = []
                    if build_name is not None:
                        build = Build()
                        build.built = datetime.datetime.utcnow()
                        build.name = build_name
                        build.id = bson.ObjectId()
                        build_id = build.id
                        release.builds.append(build)
                    project.releases.append(release)
                project.save()
                project_id = project.id
            else:
                if project is not None:
                    project_id = project.id
                    if release_name is not None:
                        for possible_release in project.releases:
                            if possible_release.name == release_name:
                                release = possible_release
                                break
                        else:
                            if create_if_missing:
                                release = Release()
                                release.id = bson.ObjectId()
                                release.name = release_name
                                release.builds = []
                                build = Build()
                                build.built = datetime.datetime.utcnow()
                                build.name = build_name
                                build.id = bson.ObjectId()
                                release.builds.append(build)
                                project.releases.append(release)
                                project.save()
                        if release is not None:
                            release_id = release.id
                            if build_name is not None:
                                for possible_build in release.builds:
                                    if possible_build.name == build_name:
                                        build_id = possible_build.id
                                        break
                                else:
                                    if create_if_missing:
                                        build = Build()
                                        build.built = datetime.datetime.utcnow()
                                        build.name = build_name
                                        build.id = bson.ObjectId()
                                        release.builds.append(build)
                                        project.save()
                                        build_id = build.id

        return project_id, release_id, build_id
