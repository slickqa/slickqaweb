'use strict';

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'static/resources/shared/main/main.html',
                controller: 'MainCtrl'
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
    .controller('MainCtrl', ['$scope', 'Restangular', '$interval', '$routeParams', '$cookies', function ($scope, rest, $interval, $routeParams, $cookies) {
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

        $scope.selectedIndex = parseInt($cookies.get("selectedIndex")) || 0;

        if (!$scope.testrunGroupsQuery) {
            $scope.testrunGroupsQuery = {
                index: 2,
                order: '-created',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }

        $scope.onTabSelected = function (index) {
            $cookies.put("selectedIndex", index)
            $scope.selectedIndex = index;
        };

        $scope.isTabSelected = function (index) {
            return index === $scope.selectedIndex;
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
            rest.one('results').one('queue', 'running').get({byProject: "true"}).then(function (resultsByProject) {
                _.each(resultsByProject, function (project) {
                    statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                    statsByProject[project._id.project]['running'] = project;
                    statsByProject[project._id.project]['running']['title'] = "Running Now";
                });
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
                $scope.getHealthData(stat.running._id.project, "Health");
                _.each(stat, function (rangeValue, rangeKey) {
                    if (rangeKey !== 'running') {
                        stat[rangeKey].total = Object.values(rangeValue).filter((status) => status && status.count !== undefined).reduce(function (sum, derp) {
                            return sum + derp.count
                        }, 0)
                    }
                });
                statsForProjectsList.push(stat)
            });
            $scope.statsForProjects = statsForProjectsList;
        };

        $scope.fetchData = function () {
            $scope.getStatsForProjects();
            $scope.currentTimeMillis = new Date().getTime();
            var testrunsQuery = {orderby: '-dateCreated', limit: $scope.testrunsQuery.queryLimit};
            if ($scope.project) {
                testrunsQuery["project.name"] = $scope.project;
                $cookies.put("projectFilter", $scope.project)
            }
            $cookies.putObject("buildsQuery", $scope.buildsQuery);
            $cookies.putObject("testrunsQuery", $scope.testrunsQuery);
            $cookies.putObject("testrunGroupsQuery", $scope.testrunGroupsQuery);
            rest.all('testruns').getList(testrunsQuery).then(function (testruns) {
                $scope.testrunListOne = testruns
            });
            rest.all('testrungroups').getList({orderby: '-created', limit: $scope.testrunGroupsQuery.queryLimit}).then(function (testrungroups) {
                $scope.testrungroupListOne = testrungroups
            });

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
            }

            if (!$scope.projects) {
                rest.all('projects').getList({dashboard: true, limit: $scope.buildsQuery.limit}).then(function (projects) {
                    $scope.projects = projects;
                    if (!$scope.project) {
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
                });
            } else if ($scope.project) {
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
        };

        $scope.healthReportOptionsByProject = {};
        $scope.healthDataByProject = {};

        let params = {limit: $scope.buildsQuery.queryLimit, groupType: "PARALLEL"};
        if ($routeParams["limit"]) {
            params.limit = $routeParams["limit"];
        }

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
                    }), function (build) {
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
                    });
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
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.fetchData();
        stop = $interval($scope.fetchData, 7500);
        window.scope = $scope;
    }]);
