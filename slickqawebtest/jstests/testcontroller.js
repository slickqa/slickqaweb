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

angular.module('slickPrototypeApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/unittests/javascript', {
                templateUrl: 'static/views/unittests-javascript.html',
                controller: 'UnitTestsJavascriptCtrl'
            });
        nav.addSection('Slick Testing', false, 'slick-testing.png');
        nav.addLink('Slick Testing', 'Javascript Unit Tests', 'unittests/javascript');
    }])
    .controller('UnitTestsJavascriptCtrl', ['$scope', function ($scope) {
        $scope.jsresults = {
            totalrun: 0,
            totalpassed: 0,
            totalfailed: 0,
            passed: [],
            failed: [],
            state: "NOT RUN"
        };

        $scope.summarize = function(suite, context) {
            if(context == null) {
                context = suite.description;
            } else {
                context = context + " -> " + suite.description;
            }
            _.each(suite.suites, function(childsuite) {
                $scope.summarize(childsuite, context);
            });

            _.each(suite.specs, function(spec) {
                $scope.jsresults.totalrun++;
                if(spec.passed) {
                    $scope.jsresults.totalpassed++;
                    $scope.jsresults.passed.push({path: context, name: spec.description})
                } else {
                    $scope.jsresults.totalfailed++;
                    $scope.jsresults.failed.push({path: context, name: spec.description})
                }
            })

        };

        $scope.runTests = function() {
            var env = jasmine.getEnv();
            var jsreporter = new jasmine.JSReporter();
            jsreporter.callbacks.push(function() {
                $scope.$apply(function() {
                    var results = jasmine.getJSReport();
                    var context = null;
                    _.each(results.suites, $scope.summarize);
                    $scope.jsresults.state = "FINISHED";
                });
            });
            env.addReporter(jsreporter);
            $scope.jsresults.state = "RUNNING";
            env.execute();
            console.log("Running Tests")
        };

        $scope.getOverallResult = function() {
            if($scope.jsresults.state != "FINISHED") {
                return $scope.jsresults.state;
            } else if($scope.jsresults.totalrun == 0) {
                return "NO RESULTS";
            } else if($scope.jsresults.totalpassed == $scope.jsresults.totalrun) {
                return "PASSED";
            } else {
                return "FAILED";
            }
        };

        $scope.runTests();
        window.gscope = $scope;
    }]);
