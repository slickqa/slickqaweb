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

        $scope.testrunTableOne = {};
        $scope.testrunTableTwo = {};
        $scope.testrunListOne = [];
        $scope.testrunListTwo = [];

        $scope.getDurationString = getDurationString;

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

        $scope.currentTimeMillis = new Date().getTime();

        $scope.fetchData = function () {

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
                rest.all('projects').getList().then(function (projects) {
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
