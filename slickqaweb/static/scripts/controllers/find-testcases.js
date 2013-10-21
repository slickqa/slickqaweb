/**
 * User: jcorbett
 * Date: 9/27/13
 * Time: 2:05 PM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/find-testcases', {
                templateUrl: 'static/views/find-testcases.html',
                controller: 'FindTestcasesCtrl'
            })
        nav.addLink('Test Management', 'Find Testcases', 'find-testcases');
    }])
    .controller('FindTestcasesCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', function ($scope, projrest, rest, nav, $routeParams) {
        // --------------------  required variables initialization ----------------------
        $scope.testcaseList = {};

        $scope.queryResult = [];

        $scope.mode = "form";

        $scope.query = "";

        $scope.queryForm = {
            project: "",
            name: "",
            component: "",
            tags: "",
            purpose: ""
        };

        $scope.project = {};
        $scope.component = {};

        // -------------------- read from query parameters ----------------------
        if($routeParams.mode == "form") {
            if($routeParams.project) {
                $scope.queryForm.project = $routeParams.project;
            }
            if($routeParams.name) {
                $scope.queryForm.name = $routeParams.name;
            }
            if($routeParams.component) {
                $scope.queryForm.component = $routeParams.component;
            }
            if($routeParams.tags) {
                $scope.queryForm.tags = $routeParams.tags;
            }
            if($routeParams.purpose) {
                $scope.queryForm.purpose = $routeParams.purpose;
            }
        } else if($routeParams.mode == "query") {
            $scope.mode = "query";
            $scope.query = $routeParams.query;
        }

        window.scope = $scope;

        // -------------------- prepare the form ----------------------
        $scope.projects = [];

        projrest.all('projects').getList().then(function(projects) {
            $scope.projects = projects;
            if($scope.queryForm.project) {
                _.each($scope.projects, function(project) {
                    if(project.id == $scope.queryForm.project) {
                        $scope.project = project;
                        if ($scope.queryForm.component) {
                            _.each($scope.project.components, function(component) {
                                if(component.id == $scope.queryForm.component) {
                                    $scope.component = component;
                                }
                            });
                        }
                    }
                });
            }
        });

        // -------------------- scope methods ----------------------

        $scope.generateQuery = function() {
            var parts = [];
            if ($scope.queryForm.project) {
                parts.push("eq(project.id,\"" + $scope.queryForm.project + "\")");
            }
            if ($scope.queryForm.component) {
                parts.push("eq(component.id,\"" + $scope.queryForm.component + "\")");
            }
            if(parts.length == 1) {
                $scope.query = parts[0];
            } else if(parts.length > 1) {
                $scope.query = "and(" + parts.join(",") + ")"
            }
        };

        $scope.generateQuery();

        if($scope.query) {
            rest.all('testcases').getList({q: $scope.query}).then(function(testcases) {
                $scope.queryResult = testcases;
            });
        }

    }]);

