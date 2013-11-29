/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testruns', {
                templateUrl: 'static/resources/pages/testruns/testrun-list.html',
                controller: 'TestrunListCtrl'
            });
        nav.addLink('Reports', 'Testrun List', 'testruns');
    }])
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookieStore', '$location', function ($scope, rest, nav, $routeParams, $cookieStore, $location) {
        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];


        if (!$routeParams["project"] && $cookieStore.get('slick-last-project-used')) {
            $location.search("project", $cookieStore.get('slick-last-project-used'));
        }

        nav.setTitle("Testruns");
        rest.all('projects').getList().then(function(projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($routeParams["project"]) {
                $scope.project = _.find(projects, function(project) {
                    return $routeParams["project"] == project.name;
                });
                $scope.$watch('project', function (newValue, oldValue) {
                    if (newValue && oldValue != newValue) {
                        $location.search("project", newValue.name);
                        $location.search("release", null);
                        $location.search("testplanId", null);
                    }
                });
                if ($scope.project) {
                    $scope.releases = $scope.project.releases;
                    if ($routeParams["release"]) {
                        $scope.release = _.find($scope.releases, function(release) {
                            return $routeParams["release"] == release.name;
                        });
                    }
                    $scope.$watch('release', function (newValue, oldValue) {
                        if(newValue) {
                            $location.search('release', newValue.name);
                        }
                    });
                    rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function(testplans) {
                        $scope.testplans = testplans;
                        if ($routeParams["testplanId"]) {
                            $scope.testplan = _.find($scope.testplans, function(testplan) {
                                return $routeParams["testplanId"] == testplan.id;
                            });
                        }
                        $scope.$watch('testplan', function(newValue, oldValue) {
                            if (newValue) {
                                $location.search("testplanId", newValue.id);
                            }
                        });
                    });
                }

            }
        });

        var testrunQuery = [];
        if ($routeParams["project"]) {
            testrunQuery.push("eq(project.name,\"" + $routeParams["project"] + "\")");
        }
        if ($routeParams["release"]) {
            testrunQuery.push("eq(release.name,\"" + $routeParams["release"] + "\")");
        }
        if ($routeParams["testplanId"]) {
            testrunQuery.push("eq(testplanId,\"" + $routeParams["testplanId"] + "\")");
        }

        var q = "";
        if (testrunQuery.length > 1) {
            q = "and(";
        }
        q = q + testrunQuery.join();
        if (testrunQuery.length > 1) {
            q = q + ")";
        }
        if (!q) {
            rest.all('testruns').getList().then(function(testruns) {
                $scope.testruns = testruns;
                window.testruns = testruns;
            });
        } else {
            rest.all('testruns').getList({q: q}).then(function(testruns) {
                $scope.testruns = testruns;
                window.testruns = testruns;
            });
        }
        $scope.testrunList = {}; // Model for the list header and filter

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

    }]);

