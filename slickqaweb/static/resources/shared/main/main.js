'use strict';

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'static/resources/shared/main/main.html',
                controller: 'MainCtrl',
                reloadOnSearch: false
            });
    }])
    .filter('unique', function () {
        return function (arr, field) {
            return _.uniq(arr, function (a) {
                return a[field];
            });
        };
    })
    .config(function ($sceDelegateProvider) {
        let allowed = [];
        try {
            if (environment && environment.iframeConfig) {
                allowed = environment.iframeConfig.map(a => `${a.url}**`);
            }
        } catch (e) {
            console.log("No environment file. That's ok.")
        }
        allowed.push("self");
        $sceDelegateProvider.resourceUrlWhitelist(allowed);
    })
    .controller('MainCtrl', ['$scope', 'Restangular', '$interval', '$timeout', '$routeParams', '$cookies', '$location', 'NavigationService', function ($scope, rest, $interval, $timeout, $routeParams, $cookies, $location, nav) {
        try {
            $scope.environment = environment;
        } catch (e) {
            //    Don't log again but still catch.
        }

        nav.setTitle("Slick");
        $scope.currentTimeMillis = new Date().getTime();

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;
        $scope.getDurationString = getDurationString;
        $scope.isObject = isObject;
        $scope.objToValues = objectToValues;

        const allProjects = 'All';

        $scope.project = $cookies.get("projectFilter");
        if ($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }

        if (!$scope.project) {
            $scope.project = allProjects;
        }

        const buildsTabName = 'Builds';
        $scope.buildList = [];
        $scope.buildsQuery = $cookies.getObject("buildsQuery");
        if (!$scope.buildsQuery) {
            $scope.buildsQuery = {
                index: 0,
                order: '-report.testruns[0].dateCreated',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setBuildsSort = function (order) {
            $scope.buildsQuery.order = order;
        };

        const testrunsTabName = 'Testruns';
        $scope.testrunList = [];
        $scope.testrunsQuery = $cookies.getObject("testrunsQuery");
        if (!$scope.testrunsQuery) {
            $scope.testrunsQuery = {
                index: 1,
                order: '-runStarted',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setTestrunsSort = function (order) {
            $scope.testrunsQuery.order = order;
        };

        const testrungroupsTabName = 'TestrunGroups';
        $scope.testrungroupList = [];
        $scope.testrunGroupsQuery = $cookies.getObject("testrunGroupsQuery");
        if (!$scope.testrunGroupsQuery) {
            $scope.testrunGroupsQuery = {
                index: 2,
                order: '-created',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setTestrunGroupsSort = function (order) {
            $scope.testrunGroupsQuery.order = order;
        };

        const pipelinesTabName = 'Pipelines';
        $scope.pipelinesList = [];
        $scope.pipelinesQuery = $cookies.getObject("pipelinesQuery");
        if (!$scope.pipelinesQuery) {
            $scope.pipelinesQuery = {
                index: 2,
                order: '-started',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setPipelinesSort = function (order) {
            $scope.pipelinesQuery.order = order;
        };

        $scope.limits = [25, 50, 100, 200];

        const statisticsTabName = 'Statistics';

        $scope.tabNameToIndex = function (tabName) {
            switch (tabName) {
                case buildsTabName:
                    return 0;
                case testrunsTabName:
                    return 1;
                case testrungroupsTabName:
                    return 2;
                case pipelinesTabName:
                    return 3;
                case statisticsTabName:
                    return 4;
                default:
                    return parseInt(tabName);
            }
        };

        $scope.isTabSelected = function (index) {
            return index === $scope.selectedIndex;
        };

        $scope.selectedIndex = $scope.tabNameToIndex($location.search().mainTab) || $scope.tabNameToIndex($cookies.get("selectedIndex")) || 0;

        $scope.onTabSelected = function (index) {
            switch (index) {
                case buildsTabName:
                    $scope.fetchBuildsData();
                    break;
            }
            $cookies.put("selectedIndex", index);
            $location.search("mainTab", index);
            $scope.selectedIndex = $scope.tabNameToIndex(index);
            $scope.fetchData();
        };

        let stop;
        let builds;
        let pipelines;
        let check;

        // $scope.statTabNameToIndex = function (statTabName) {
        //     if ($scope.statsForProjects) {
        //         let index = $scope.statsForProjects.findIndex(function (stat) {
        //             return stat.title === statTabName || 0;
        //         });
        //         if (index !== -1) {
        //             return index;
        //         } else {
        //             return 0;
        //         }
        //     }
        // };

        // $scope.onStatTabSelected = function (index) {
        // $cookies.put("selectedStatIndex", index);
        // $location.search("statsTab", index);
        // $scope.selectedStatIndex = $scope.statTabNameToIndex(index);
        // };

        // $scope.isStatTabSelected = function (index) {
        //     return index === $scope.selectedStatIndex;
        // };

        $scope.statsForProjects = [];
        $scope.testcasesByProject = {};
        let statsByProject = {};
        $scope.getStatsForProjects = function () {
            return rest.one('results').one('queue', 'running').get({byProject: "true"}).then(function (resultsByProject) {
                _.each(resultsByProject, function (project) {
                    if (!project._id.release || project._id.release === "") {
                        return;
                    }
                    statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                    statsByProject[project._id.project]['title'] = project._id.project;
                    statsByProject[project._id.project]['activeRelease'] = statsByProject[project._id.project]['activeRelease'] || project._id.release;
                    statsByProject[project._id.project][project._id.release] = statsByProject[project._id.project][project._id.release] || {};
                    statsByProject[project._id.project][project._id.release]['title'] = project._id.release;
                    statsByProject[project._id.project][project._id.release]['running'] = project;
                    statsByProject[project._id.project][project._id.release]['running']['title'] = "Running Now";
                });
                _.each([1, 7, 14, 30], function (days) {
                    rest.one('results').one('queue', 'finished').get({days: days}).then(function (finishedByProject) {
                        _.each(finishedByProject, function (project) {
                            if (!project._id.release || project._id.release === "") {
                                return;
                            }
                            statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                            statsByProject[project._id.project]['title'] = project._id.project;
                            statsByProject[project._id.project]['activeRelease'] = statsByProject[project._id.project]['activeRelease'] || project._id.release;
                            statsByProject[project._id.project][project._id.release] = statsByProject[project._id.project][project._id.release] || {};
                            statsByProject[project._id.project][project._id.release]['title'] = project._id.release;
                            statsByProject[project._id.project][project._id.release][days] = statsByProject[project._id.project][project._id.release][days] || {};
                            statsByProject[project._id.project][project._id.release][days]['title'] = days !== 1 ? `Past ${days} days` : "Today";
                            statsByProject[project._id.project][project._id.release][days][project._id.status] = project;
                            statsByProject[project._id.project][project._id.release]['running'] = statsByProject[project._id.project][project._id.release]['running'] || {count: 0, _id: {project: project._id.project}};
                            statsByProject[project._id.project][project._id.release]['running']['title'] = "Running Now";
                        });
                    });
                    rest.one('testcases').one('recently-created').get({days: days}).then(function (createdByProject) {
                        _.each(createdByProject, function (project) {
                            $scope.testcasesByProject[project._id.project] = $scope.testcasesByProject[project._id.project] || {};
                            $scope.testcasesByProject[project._id.project][days] = $scope.testcasesByProject[project._id.project][days] || {};
                            $scope.testcasesByProject[project._id.project][days]['title'] = days !== 1 ? `Past ${days} days` : "Today";
                            $scope.testcasesByProject[project._id.project][days]['count'] = project
                        });
                    });
                });
                let statsForProjectsList = [];
                _.each(Object.values(statsByProject), function (stat) {
                    _.each(stat, function (releaseValue, releaseKey) {
                        _.each(releaseValue, function (rangeValue, rangeKey) {
                            if (rangeKey !== 'running') {
                                if (typeof stat[releaseKey][rangeKey] === "object") {
                                    stat[releaseKey][rangeKey].total = Object.values(rangeValue).filter((status) => status && status.count !== undefined).reduce(function (sum, derp) {
                                        return sum + derp.count
                                    }, 0);
                                }
                            }
                        });
                    });
                    statsForProjectsList.push(stat)
                });
                // $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
                return _.sortBy(statsForProjectsList, 'title');
            });
        };

        $scope.checkForStatsForProject = function () {
            if ($scope.statsForProjects && $scope.statsForProjects.length !== 0) {
                $interval.cancel(check);
                check = undefined;
                $scope.getHealthData($scope.statsForProjects[0].title, $scope.statsForProjects[0].activeRelease);
            } else if (!check) {
                check = $interval($scope.checkForStatsForProject, 500)
            }
        };

        $scope.checkForStatsForProject();

        let firstFetch = true;
        $scope.fetchData = function () {
            if ($scope.selectedIndex === $scope.tabNameToIndex(statisticsTabName) || firstFetch) {
                $scope.getStatsForProjects().then(function (response) {
                    $scope.statsForProjects = response;
                    // $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
                });
            }
            $scope.currentTimeMillis = new Date().getTime();
            let testrunsQuery = {orderby: '-runStarted', limit: $scope.testrunsQuery.queryLimit};
            if ($scope.project) {
                $cookies.put("projectFilter", $scope.project)
            }
            if ($scope.project && $scope.project !== allProjects) {
                testrunsQuery["project.name"] = $scope.project;
            }
            $cookies.putObject("buildsQuery", $scope.buildsQuery);
            $cookies.putObject("testrunsQuery", $scope.testrunsQuery);
            $cookies.putObject("testrunGroupsQuery", $scope.testrunGroupsQuery);
            if ($scope.selectedIndex === $scope.tabNameToIndex(testrunsTabName) || firstFetch) {
                rest.all('testruns').getList(testrunsQuery).then(function (testruns) {
                    $scope.testrunList = testruns
                });
            }
            if ($scope.selectedIndex === $scope.tabNameToIndex(testrungroupsTabName) || firstFetch) {
                rest.all('testrungroups').getList({orderby: '-created', limit: $scope.testrunGroupsQuery.queryLimit}).then(function (testrungroups) {
                    $scope.testrungroupList = testrungroups
                });
            }
            firstFetch = false;
            if (!stop) {
                stop = $interval($scope.fetchData, 3000)
            }
        };

        let firstBuildsFetch = true;
        $scope.fetchBuildsData = function () {
            // recent builds are a little tricky
            let buildList = [];

            function processBuildList(buildList) {
                buildList = _.sortBy(buildList, function (build) {
                    if (build.build.built) {
                        return build.build.built;
                    } else {
                        return 0;
                    }
                });
                buildList.reverse();
                let tempBuildList = [];
                let promises = [];
                _.each(buildList.slice(0, $scope.buildsQuery.queryLimit), function (buildInfo) {
                    promises.push(rest.one('build-report', buildInfo.project.name).one(buildInfo.release.name, buildInfo.build.name).get().then(function (buildReport) {
                        buildInfo.report = buildReport;
                        tempBuildList.push(buildInfo)
                    }))
                });
                Promise.all(promises).then(function () {
                    $scope.buildList = tempBuildList;
                    builds = $timeout($scope.fetchBuildsData, 3000)
                });
                firstBuildsFetch = false;
            }

            if (!$scope.projects || $scope.project === allProjects) {
                rest.all('projects').getList({dashboard: true, limit: $scope.buildsQuery.limit, orderby: '-releases.builds.built'}).then(function (projects) {
                    $scope.projects = projects;
                    if ($scope.selectedIndex === $scope.tabNameToIndex(buildsTabName) || firstBuildsFetch) {
                        if (!$scope.project || $scope.project === allProjects) {
                            _.each(projects, function (project) {
                                _.each(project.releases, function (release) {
                                    _.each(release.builds, function (build) {
                                        // This creates a flat list that we can sort
                                        buildList.push({build: build, project: project, release: release});
                                    });
                                });
                            });
                            processBuildList(buildList);
                        } else {
                            rest.one('projects', $scope.project).get().then(function (project) {
                                _.each(project.releases, function (release) {
                                    _.each(release.builds, function (build) {
                                        // This creates a flat list that we can sort
                                        buildList.push({build: build, project: project, release: release});
                                    });
                                });
                                processBuildList(buildList);
                            });
                        }
                    }
                });
            } else if ($scope.project) {
                if ($scope.selectedIndex === $scope.tabNameToIndex(buildsTabName) || firstBuildsFetch) {
                    rest.one('projects', $scope.project).get().then(function (project) {
                        _.each(project.releases, function (release) {
                            _.each(release.builds, function (build) {
                                // This creates a flat list that we can sort
                                buildList.push({build: build, project: project, release: release});
                            });
                        });
                        processBuildList(buildList);
                    });
                }
            }
        };

        let firstTimelineFetch = true;
        $scope.fetchPipelinesData = function () {
            if ($scope.selectedIndex === $scope.tabNameToIndex(pipelinesTabName) || firstTimelineFetch) {
                let pipelinesQuery = {orderby: '-started', limit: $scope.pipelinesQuery.queryLimit};
                if ($scope.project && $scope.project !== allProjects) {
                    pipelinesQuery["project.name"] = $scope.project;
                    $cookies.put("projectFilter", $scope.project)
                }
                $cookies.putObject("pipelinesQuery", $scope.pipelinesQuery);
                rest.all('pipelines').getList(pipelinesQuery).then(function (pipelines) {
                    $scope.pipelinesList = pipelines;
                });
                if (!pipelines) {
                    pipelines = $interval($scope.fetchPipelinesData, 3000)
                }
            }
        };

        $scope.healthReportOptionsByProject = {};
        $scope.healthDataByProject = {};

        let params = {limit: $scope.buildsQuery.queryLimit, groupType: "PARALLEL"};
        if ($routeParams["limit"]) {
            params.limit = $routeParams["limit"];
        }

        let healthIntervals = {};

        $scope.getHealthData = function (project, release) {
            rest.one('release-report', project).one(release).get(params).then(function (releaseReport) {
                $scope.healthReportOptionsByProject[project] = {
                    chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                    backgroundColor: "none",
                    vAxis: {
                        minValue: 0,
                        maxValue: 100,
                        format: '#\'%\''
                    },
                    lineWidth: 5,
                    legend: {
                        textStyle: {
                            color: "#ffffff"
                        }
                    },
                    width: '100%',
                    colors: []
                };
                if (releaseReport.hasOwnProperty('name')) {
                    $scope.healthDataByProject[project] = new google.visualization.DataTable();
                    $scope.healthDataByProject[project].addColumn('date', 'Recorded');
                    let gotXAndY = false;
                    _.each(releaseReport.builds.sort(function (a, b) {
                        return (a.testruns[0].dateCreated > b.testruns[0].dateCreated) ? 1 : ((b.testruns[0].dateCreated > a.testruns[0].dateCreated) ? -1 : 0);
                    }), function (build, index) {
                        let row = [new Date(build.testruns[0].dateCreated)];
                        let sum = Object.values(build.groupSummary.resultsByStatus).reduce((a, b) => a + b, 0);
                        if (!gotXAndY) {
                            _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                let color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                                $scope.healthReportOptionsByProject[project].colors.push(color);
                                $scope.healthDataByProject[project].addColumn('number', replaceOnStatus(status, " "));
                            });
                            gotXAndY = true;
                            //$scope.healthDataByProject[project].addColumn('string', 'Build');
                        }
                        _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                            row.push(build.groupSummary.resultsByStatus[status] / sum * 100);
                        });
                        // row.push(`${build.testruns[0].project.name}/${build.testruns[0].release.name}/${build.testruns[0].build.name}`);
                        $scope.healthDataByProject[project].addRow(row);
                        $scope.healthDataByProject[project].setRowProperties(index, {project: build.testruns[0].project.name, release: build.testruns[0].release.name, build: build.testruns[0].build.name})
                    });
                    if (!healthIntervals[project]) {
                        healthIntervals[project] = $interval(function () {
                            if ($scope.selectedIndex === $scope.tabNameToIndex(statisticsTabName)) {
                                $scope.getHealthData(project, $scope.statsForProjects[$scope.statsForProjects.findIndex(function (stat) {
                                    return stat.title === project || 0;
                                })].activeRelease);
                            }
                        }, 10000);
                    }
                }
            }, function errorCallback(error) {
                console.log(error)
            });
        };

        $scope.stopRefresh = function () {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
            if (angular.isDefined(builds)) {
                $timeout.cancel(builds);
                builds = undefined;
            }
            if (angular.isDefined(pipelines)) {
                $timeout.cancel(pipelines);
                pipelines = undefined;
            }
            if (angular.isDefined(check)) {
                $interval.cancel(check);
                check = undefined;
            }
            _.each(Object.keys(healthIntervals), function (key) {
                if (angular.isDefined(healthIntervals[key])) {
                    $interval.cancel(healthIntervals[key]);
                    healthIntervals[key] = undefined;
                }
            })
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.fetchData();
        $scope.fetchPipelinesData();
        $scope.fetchBuildsData();
        window.scope = $scope;
    }]);
