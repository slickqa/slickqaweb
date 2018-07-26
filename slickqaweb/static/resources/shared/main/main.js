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
    .controller('MainCtrl', ['$scope', 'Restangular', '$interval', '$routeParams', '$cookies', '$location', function ($scope, rest, $interval, $routeParams, $cookies, $location) {
        try {
            $scope.environment = environment;
        } catch (e) {
            //    Don't log again but still catch.
        }

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrunTableOne = {};
        $scope.testrunTableTwo = {};
        $scope.testrunListOne = [];
        $scope.testrunListTwo = [];

        $scope.getDurationString = getDurationString;

        $scope.objToValues = function (obj) {
            return Object.values(obj);
        };

        $scope.testrungroupTableOne = {};
        $scope.testrungroupTableTwo = {};
        $scope.testrungroupListOne = [];
        $scope.testrungroupListTwo = [];

        $scope.buildTableOne = {};
        $scope.buildTableTwo = {};
        $scope.buildListOne = [];
        $scope.buildListTwo = [];
        $scope.project = $cookies.get("projectFilter");
        $scope.limits = [25, 50, 100, 200];
        if ($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }

        var stop;
        var check;

        // $scope.testrunChartOptions = {
        //             chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
        //             backgroundColor: "#000000",
        //             legend: {
        //                 textStyle: {
        //                     color: "#ffffff"
        //                 }
        //             },
        //             colors: []
        //         };

        $scope.buildsQuery = $cookies.getObject("buildsQuery");
        $scope.testrunsQuery = $cookies.getObject("testrunsQuery");
        $scope.testrunGroupsQuery = $cookies.getObject("testrunGroupsQuery");
        if (!$scope.buildsQuery) {
            $scope.buildsQuery = {
                index: 0,
                order: '-report.testruns[0].dateCreated',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        if (!$scope.testrunsQuery) {
            $scope.testrunsQuery = {
                index: 1,
                order: '-dateCreated',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }

        if (!$scope.testrunGroupsQuery) {
            $scope.testrunGroupsQuery = {
                index: 2,
                order: '-created',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }

        $scope.tabNameToIndex = function (tabName) {
            switch (tabName) {
                case 'Builds':
                    return 0;
                case 'Testruns':
                    return 1;
                case 'TestrunGroups':
                    return 2;
                case 'Statistics':
                    return 3;
                default:
                    return parseInt(tabName);
            }
        };

        $scope.statTabNameToIndex = function (statTabName) {
            if ($scope.statsForProjects) {
                let index = $scope.statsForProjects.findIndex(function (stat) {
                    return stat.running._id.project === statTabName || 0;
                });
                if (index !== -1) {
                    return index;
                } else {
                    return 0;
                }
            }
        };

        $scope.selectedIndex = $scope.tabNameToIndex($location.search().mainTab) || $scope.tabNameToIndex($cookies.get("selectedIndex")) || 0;

        $scope.onTabSelected = function (index) {
            $cookies.put("selectedIndex", index);
            $location.search("mainTab", index);
            $scope.selectedIndex = $scope.tabNameToIndex(index);
            $scope.fetchData();
        };

        $scope.isTabSelected = function (index) {
            return index === $scope.selectedIndex;
        };

        $scope.onStatTabSelected = function (index) {
            $cookies.put("selectedStatIndex", index);
            $location.search("statsTab", index);
            $scope.selectedStatIndex = $scope.statTabNameToIndex(index);
        };

        $scope.isStatTabSelected = function (index) {
            return index === $scope.selectedStatIndex;
        };

        $scope.setBuildsSort = function (order) {
            $scope.buildsQuery.order = order;
        };

        $scope.setTestrunsSort = function (order) {
            $scope.testrunsQuery.order = order;
        };

        $scope.setTestrunGroupsSort = function (order) {
            $scope.testrunGroupsQuery.order = order;
        };

        $scope.statsForProjects = [];

        $scope.currentTimeMillis = new Date().getTime();
        let statsByProject = {};
        $scope.getStatsForProjects = function () {
            return rest.one('results').one('queue', 'running').get({byProject: "true"}).then(function (resultsByProject) {
                _.each(resultsByProject, function (project) {
                    statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                    statsByProject[project._id.project]['running'] = project;
                    statsByProject[project._id.project]['running']['title'] = "Running Now";
                });
                _.each([1, 7, 14, 30], function (days) {
                rest.one('results').one('queue', 'finished').get({days: days}).then(function (finishedByProject) {
                    _.each(finishedByProject, function (project) {
                        statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                        statsByProject[project._id.project][days] = statsByProject[project._id.project][days] || {};
                        statsByProject[project._id.project][days]['title'] = days !== 1 ? `Past ${days} days` : "Today";
                        statsByProject[project._id.project][days][project._id.status] = project;
                        statsByProject[project._id.project]['running'] = statsByProject[project._id.project]['running'] || {count: 0, _id: {project: project._id.project}};
                        statsByProject[project._id.project]['running']['title'] = "Running Now";
                    });
                });
            });
            let statsForProjectsList = [];
            _.each(Object.values(statsByProject), function (stat) {
                _.each(stat, function (rangeValue, rangeKey) {
                    if (rangeKey !== 'running') {
                        stat[rangeKey].total = Object.values(rangeValue).filter((status) => status && status.count !== undefined).reduce(function (sum, derp) {
                            return sum + derp.count
                        }, 0)
                    }
                });
                statsForProjectsList.push(stat)
            });
            $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
            return _.sortBy(statsForProjectsList, 'running._id.project');
            });
        };

        $scope.checkForStatsForProject = function () {
            if ($scope.statsForProjects && $scope.statsForProjects.length !== 0) {
                $interval.cancel(check);
                _.each($scope.statsForProjects, function (stat) {
                    $scope.getHealthData(stat.running._id.project, "Health");
                })
            } else if (!check) {
                check = $interval($scope.checkForStatsForProject, 500)
            }
        };

        $scope.checkForStatsForProject();
        let fetchCount = 1;
        $scope.fetchData = function () {
            if ($scope.selectedIndex === $scope.tabNameToIndex('Statistics') || fetchCount === 1) {
                $scope.getStatsForProjects().then(function(response) {
                    $scope.statsForProjects = response;
                    $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
                });
            }
            $scope.currentTimeMillis = new Date().getTime();
            var testrunsQuery = {orderby: '-dateCreated', limit: $scope.testrunsQuery.queryLimit};
            if ($scope.project) {
                testrunsQuery["project.name"] = $scope.project;
                $cookies.put("projectFilter", $scope.project)
            }
            $cookies.putObject("buildsQuery", $scope.buildsQuery);
            $cookies.putObject("testrunsQuery", $scope.testrunsQuery);
            $cookies.putObject("testrunGroupsQuery", $scope.testrunGroupsQuery);
            if ($scope.selectedIndex === $scope.tabNameToIndex('Testruns') || fetchCount === 1) {
                rest.all('testruns').getList(testrunsQuery).then(function (testruns) {
                    $scope.testrunListOne = testruns
                });
            }
            if ($scope.selectedIndex === $scope.tabNameToIndex('TestrunGroups') || fetchCount === 1) {
                rest.all('testrungroups').getList({orderby: '-created', limit: $scope.testrunGroupsQuery.queryLimit}).then(function (testrungroups) {
                    $scope.testrungroupListOne = testrungroups
                });
            }

            // recent builds are a little tricky
            var buildList = [];

            function processBuildList(buildList) {
                buildList = _.sortBy(buildList, function (build) {
                    if (build.build.built) {
                        return build.build.built;
                    } else {
                        return 0;
                    }
                });
                buildList.reverse();
                _.each(buildList.slice(0, $scope.buildsQuery.queryLimit), function (buildInfo, index) {
                    rest.one('build-report', buildInfo.project.name).one(buildInfo.release.name, buildInfo.build.name).get().then(function (buildReport) {
                        buildInfo.report = buildReport;
                        $scope.buildListOne[index] = buildInfo;
                    });
                });
                fetchCount += 1;
            }

            if (!$scope.projects) {
                rest.all('projects').getList({dashboard: true, limit: $scope.buildsQuery.limit}).then(function (projects) {
                    $scope.projects = projects;
                    if (!$scope.project || $scope.project === 'All') {
                        _.each(projects, function (project) {
                            _.each(project.releases, function (release) {
                                _.each(release.builds, function (build) {
                                    // This creates a flat list that we can sort
                                    buildList.push({build: build, project: project, release: release});
                                });
                            });
                        });
                        if ($scope.selectedIndex === $scope.tabNameToIndex('Builds') || fetchCount === 1) {
                            processBuildList(buildList);
                        }
                    } else {
                        rest.one('projects', $scope.project).get().then(function (project) {
                            _.each(project.releases, function (release) {
                                _.each(release.builds, function (build) {
                                    // This creates a flat list that we can sort
                                    buildList.push({build: build, project: project, release: release});
                                });
                            });
                            if ($scope.selectedIndex === $scope.tabNameToIndex('Builds') || fetchCount === 1) {
                                processBuildList(buildList);
                            }
                        });
                    }
                });
            } else if ($scope.project) {
                rest.one('projects', $scope.project).get().then(function (project) {
                    _.each(project.releases, function (release) {
                        _.each(release.builds, function (build) {
                            // This creates a flat list that we can sort
                            buildList.push({build: build, project: project, release: release});
                        });
                    });
                    if ($scope.selectedIndex === $scope.tabNameToIndex('Builds') || fetchCount === 1) {
                        processBuildList(buildList);
                    }
                });
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
                            if ($scope.selectedIndex === $scope.tabNameToIndex('Statistics')) {
                                $scope.getHealthData(project, release);
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
                _.each(Object.keys(healthIntervals), function (key) {
                    $interval.cancel(healthIntervals[key]);
                    healthIntervals[key] = undefined;
                })
            }
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.fetchData();
        stop = $interval($scope.fetchData, 3000);
        window.scope = $scope;
    }]);
