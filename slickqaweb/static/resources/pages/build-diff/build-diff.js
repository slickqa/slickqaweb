'use strict';

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/build-diff/:project', {
                templateUrl: 'static/resources/pages/build-diff/build-diff.html',
                controller: 'BuildDiffCtrl'
            })
    }])
    .controller('BuildDiffCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location) {
        nav.setTitle("Compare Builds");

        if ($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }
        
        $scope.currentTimeMillis = new Date().getTime();

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;
        $scope.getDurationString = getDurationString;
        $scope.isObject = isObject;
        $scope.objToValues = objectToValues;

        $scope.releasesForComparison1 = [];
        $scope.releasesSearchTerm1 = "";
        $scope.buildsForComparison1 = [];
        $scope.buildsSearchTerm1 = "";
        $scope.releaseForComparison1 = "";
        $scope.buildForComparison1 = "";
        $scope.resultsForComparison1 = undefined;

        $scope.releasesForComparison2 = [];
        $scope.releasesSearchTerm2 = "";
        $scope.buildsForComparison2 = [];
        $scope.buildsSearchTerm2 = "";
        $scope.releaseForComparison2 = "";
        $scope.buildForComparison2 = "";
        $scope.resultsForComparison2 = undefined;

        $scope.resultDifferences = undefined;

        $scope.navigateTo = function (uri) {
            window.open($location.$$absUrl.replace($location.$$path, uri), '_blank');
        };

        $scope.getReleasesForComparison = function(project_name, whichSide) {
            if (whichSide === undefined) {
                $scope.releasesForComparison1 = [];
                $scope.releasesForComparison2 = [];
                $scope.buildReport1 = undefined;
                $scope.buildReport2 = undefined;
                $scope.resultsForComparison1 = undefined;
                $scope.resultsForComparison2 = undefined;
            } else {
                $scope[`releasesForComparison${whichSide}`] = []
            }
            return rest.one('projects', project_name).one('releases').get().then(function (releases) {
                if (whichSide === undefined) {
                    $scope.releasesForComparison1 = releases.reverse();
                    $scope.releasesForComparison2 = $scope.releasesForComparison1;
                } else {
                    $scope[`releasesForComparison${whichSide}`] = releases.reverse()
                }
            })
        };

        $scope.getBuildsForComparison = function (project_name, release_name, whichSide) {
            if (whichSide === undefined) {
                $scope.buildsForComparison1 = [];
                $scope.buildsForComparison2 = [];
                $scope.resultsForComparison1 = undefined;
                $scope.resultsForComparison2 = undefined;
                $scope.resultDifferences = undefined;
            } else {
                $scope[`buildsForComparison${whichSide}`] = []
            }
            if (release_name != "") {
                return rest.one('projects', project_name).one('releases', release_name).one('builds').get().then(function (builds) {
                    if (whichSide === undefined) {
                        $scope.buildsForComparison1 = builds.reverse();
                        $scope.buildsForComparison2 = $scope.buildsForComparison1;
                    } else {
                        $scope[`buildsForComparison${whichSide}`] = builds.reverse()
                    }
                })
            }
        };

        $scope.buildReport1 = undefined;
        $scope.buildReport2 = undefined;

        function passed(result) {
            return result.status === "PASS" || result.status === "PASSED_ON_RETRY"
        }

        function notPassed(result) {
            return result.status !== "PASS" && result.status !== "PASSED_ON_RETRY"
        }

        $scope.getComparisonBuildReports = function(project_name, release1, build1, release2, build2) {
            $scope.buildReport1 = undefined;
            $scope.buildReport2 = undefined;
            $scope.resultDifferences = undefined;
            rest.one('build-report', project_name).one(release1.name, build1.name).get().then(function (buildReport1) {
                $scope.buildReport1 = buildReport1;
            });
            rest.one('build-report', project_name).one(release2.name, build2.name).get().then(function (buildReport2) {
                $scope.buildReport2 = buildReport2;
            });
            rest.all('results').getList({q: 'and(eq(project.name,"' + project_name + '"),' + 'eq(release.releaseId,"' + release1.id + '"),eq(build.buildId,"' + build1.id + '"),or(eq(status,"PASS"),eq(status,"PASSED_ON_RETRY"),eq(status,"FAIL"),eq(status,"BROKEN_TEST"),eq(status,"NOT_TESTED"),eq(status,"SKIPPED"),eq(status,"NO_RESULT")))'}).then(function(results1) {
                rest.all('results').getList({q: 'and(eq(project.name,"' + project_name + '"),' + 'eq(release.releaseId,"' + release2.id + '"),eq(build.buildId,"' + build2.id + '"),or(eq(status,"PASS"),eq(status,"PASSED_ON_RETRY"),eq(status,"FAIL"),eq(status,"BROKEN_TEST"),eq(status,"NOT_TESTED"),eq(status,"SKIPPED"),eq(status,"NO_RESULT")))'}).then(function(results2) {
                    $scope.resultDifferences = {'newFailures': [], 'fixed': [], 'existing': [], 'added': [], 'removed': []};
                    _.each(results1, function(result1) {
                        let found = false;
                        _.each(results2, function(result2) {
                            if (result1.testcase.testcaseId === result2.testcase.testcaseId) {
                                found = true;
                                if (passed(result1) && notPassed(result2)) {
                                    $scope.resultDifferences.newFailures.push({'result1': result1, 'result2': result2})
                                } else if (notPassed(result1) && passed(result2)) {
                                    $scope.resultDifferences.fixed.push({'result1': result1, 'result2': result2})
                                } else if (notPassed(result1) && notPassed(result2)) {
                                    $scope.resultDifferences.existing.push({'result1': result1, 'result2': result2})
                                }
                            }
                        });
                        if (!found) {
                            $scope.resultDifferences.removed.push(result1)
                        }
                    });
                    _.each(results2, function(result2) {
                        let found = false;
                        _.each(results1, function (result1) {
                            if (result1.testcase.testcaseId === result2.testcase.testcaseId) {
                                found = true;
                            }
                        });
                        if (!found) {
                            $scope.resultDifferences.added.push(result2)
                        }
                    });
                });

            });

        };

        let promises = [];

        $scope.getReleasesForComparison($scope.project).then(function() {
            if ($routeParams["release1"]) {
                $scope.releaseForComparison1 = $scope.releasesForComparison1.filter(function(x) {return x.name === $routeParams["release1"]})[0];
                promises.push($scope.getBuildsForComparison($scope.project, $scope.releaseForComparison1.name, "1").then(function() {
                    if ($routeParams["build1"]) {
                        $scope.buildForComparison1 = $scope.buildsForComparison1.filter(function(x) {return x.name === $routeParams["build1"]})[0]
                    }
                }))
            }
            if ($routeParams["release2"]) {
                $scope.releaseForComparison2 = $scope.releasesForComparison2.filter(function(x) {return x.name === $routeParams["release2"]})[0];
                promises.push($scope.getBuildsForComparison($scope.project, $scope.releaseForComparison2.name, "2").then(function() {
                    if ($routeParams["build2"]) {
                        $scope.buildForComparison2 = $scope.buildsForComparison2.filter(function(x) {return x.name === $routeParams["build2"]})[0]
                    }
                }))
            }
            if ($routeParams["release1"] && $routeParams["release2"] && $routeParams["build1"] && $routeParams["build2"]) {
                Promise.all(promises).then(function() {
                    $scope.getComparisonBuildReports($scope.project, $scope.releaseForComparison1, $scope.buildForComparison1, $scope.releaseForComparison2, $scope.buildForComparison2);
                });
            }
        });


        window.scope = $scope;
    }]);
