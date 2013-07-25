/**
 *
 * This file is NOT A TEST.  It is actually a angularjs controller for a view that will run the unit tests from
 * a running slick.  It's placed in the jstests directory because we only want it included in when tests are available.
 *
 * User: jcorbett
 * Date: 7/15/13
 * Time: 3:23 PM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/unittests/javascript', {
                templateUrl: 'static/views/unittests-javascript.html',
                controller: 'UnitTestsJavascriptCtrl'
            })
            .when('/unittests/python', {
                templateUrl: 'static/views/unittests-python.html',
                controller: 'UnitTestsPythonCtrl'
            });
        nav.addSection('Slick Testing', false, 'slick-testing.png');
        nav.addLink('Slick Testing', 'Javascript Unit Tests', 'unittests/javascript');
        nav.addLink('Slick Testing', 'Python Unit Tests', 'unittests/python');
    }])
    .controller('UnitTestsJavascriptCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        nav.setTitle("Javascript Unit Tests for Slick");
        $scope.results = {
            totalrun: 0,
            totalpassed: 0,
            totalfailed: 0,
            passed: [],
            failed: [],
            state: "NOT RUN"
        };

        $scope.summarize = function(suite, context) {
            if(context === null) {
                context = suite.description;
            } else {
                context = context + " -> " + suite.description;
            }
            _.each(suite.suites, function(childsuite) {
                $scope.summarize(childsuite, context);
            });

            _.each(suite.specs, function(spec) {
                $scope.results.totalrun++;
                if(spec.passed) {
                    $scope.results.totalpassed++;
                    $scope.results.passed.push({path: context, name: spec.description})
                } else {
                    $scope.results.totalfailed++;
                    $scope.results.failed.push({path: context, name: spec.description, message: spec.message})
                }
            })

        };

        $scope.runTests = function() {
            var env = jasmine.getEnv();
            var jsreporter = new jasmine.JSReporter();
            jsreporter.callbacks.push(function() {
                $scope.$apply(function() {
                    var jresults = jasmine.getJSReport();
                    _.each(jresults.suites, function(suite) {
                        $scope.summarize(suite, null);
                    });
                    $scope.results.state = "FINISHED";
                });
            });
            env.addReporter(jsreporter);
            $scope.results.state = "RUNNING";
            env.execute();
            console.log("Running Tests")
        };

        $scope.runTests();
        window.gscope = $scope;
    }])
    .controller('UnitTestsPythonCtrl', ['$scope', '$resource', 'NavigationService', function($scope, $resource, nav) {
        nav.setTitle("Python Unit Tests for Slick");
        var unittestresource = $resource('api/unittests');
        $scope.results = unittestresource.get();
    }])
    .controller('UnittestResultCtrl', ['$scope', function ($scope) {
        $scope.getOverallResult = function() {
            if($scope.results.state != "FINISHED") {
                return $scope.results.state;
            } else if($scope.results.totalrun == 0) {
                return "NO RESULTS";
            } else if($scope.results.totalpassed == $scope.results.totalrun) {
                return "PASSED";
            } else {
                return "FAILED";
            }
        };
        $scope.showPassed = false;
        $scope.showFailed = true;

        $scope.toggleShow = function(name) {
            if(name == "passed") {
                if($scope.showPassed) {
                    $scope.showPassed = false;
                } else {
                    $scope.showPassed = true;
                }
            } else if(name == "failed") {
                if($scope.showFailed) {
                    $scope.showFailed = false;
                } else {
                    $scope.showFailed = true;
                }
            }
        }

    }]);
