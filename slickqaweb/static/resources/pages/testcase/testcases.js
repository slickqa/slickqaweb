/**
 * User: slambson
 * Date: 10/29/13
 * Time: 2:59 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testcases/:name', {
                templateUrl: 'static/resources/pages/testcase/view-testcase.html',
                controller: 'ViewAndUpdateTestcaseCtrl'
            });
    }])
    .controller('ViewAndUpdateTestcaseCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.stepsList = {};

        $scope.showAddStep = false;
        $scope.step = {
            name: "",
            expectedResult: ""
        };

        $scope.toggleAddStep = function() {
            $scope.showAddStep = !$scope.showAddStep;
        };

        $scope.addStepDialogButtonClicked = function(buttonName) {
            if(buttonName == "Add") {
                if(! $scope.testcase.steps) {
                    $scope.testcase.steps = [];
                }
                $scope.testcase.steps.push({ name: String($scope.step.name), expectedResult: String($scope.step.expectedResult), id: (new ObjectId()).toString()});
                $scope.testcaseForm.$setDirty();
            } else {
                //Cancel button was clicked
            }
            $scope.step.name = "";
            $scope.step.expectedResult = "";
            $scope.toggleAddStep();
        };

        rest.one('testcases', $routeParams.name).get().then(function(testcase) {
            $scope.testcase = testcase;
            window.testcase = testcase;
            nav.setTitle($scope.testcase.name);
            $scope.stepsList = {};
            _.each(testcase.steps, function(step) {
                $scope.stepsList[step.name] = {};
            });
        });

        $scope.save = function() {
            $scope.testcase.put().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.testcaseForm.$setPristine();
            });
        };

        $scope.revert = function() {
            $scope.testcase.get().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.testcaseForm.$setPristine();
            });
        };
    }
]);
