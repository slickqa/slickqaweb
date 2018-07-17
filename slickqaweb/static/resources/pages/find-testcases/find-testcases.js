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
                templateUrl: 'static/resources/pages/find-testcases/find-testcases.html',
                controller: 'FindTestcasesCtrl'
            })
            .when('/testcases', {
                templateUrl: 'static/resources/pages/find-testcases/testcase-tree.html',
                controller: 'TestcaseTreeCtrl'
            });
        nav.addLink('Test Management', 'Query for Testcases', 'find-testcases');
        nav.addLink('Test Management', 'Browse Testcases', 'testcases');
    }])
    .controller('FindTestcasesCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', '$location', function ($scope, projrest, rest, nav, $routeParams, $location) {
        nav.setTitle("Query For Testcases");
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
            if ($scope.queryForm.name) {
                parts.push("icontains(name,\"" + $scope.queryForm.name + "\")");
            }
            if ($scope.queryForm.tags) {
                var taglist = [];
                _.each($scope.queryForm.tags.split(","), function(tag) {
                    taglist.push(tag.trim())
                });
                parts.push("in(tags,(\"" + taglist.join("\",\"") + "\"))");
            }
            if ($scope.queryForm.purpose) {
                parts.push("icontains(purpose,\"" + $scope.queryForm.purpose + "\")");
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

        $scope.executeQuery = function() {
            if($scope.mode == "form") {
                $location.search('mode', $scope.mode);
                _.each(["project", "component", "name", "tags", "purpose"], function(part) {
                    if($scope.queryForm[part]) {
                        $location.search(part, $scope.queryForm[part]);
                    } else {
                        $location.search(part, null);
                    }
                });
            } else {
                $location.search('mode', $scope.mode);
                // wipe out current search parameters
                _.each(["project", "component", "name", "tags", "purpose"], function(part) {
                    $location.search(part, null);
                });
                $location.search('query', $scope.query);
            }
        };

        // ------------------- watches ------------------------
        $scope.$watch('project', function() {
            if($scope.project.id) {
                $scope.queryForm.project = $scope.project.id;
            }
            $scope.generateQuery();
        });

        $scope.$watch('component', function() {
            if($scope.component.id) {
                $scope.queryForm.component = $scope.component.id;
            }
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.name', function() {
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.tags', function() {
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.purpose', function() {
            $scope.generateQuery();
        });


    }])
    .controller('TestcaseTreeCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', '$location', '$cookies', function ($scope, projrest, rest, nav, $routeParams, $location, $cookies) {
        // --------------- Initialize Variables used in the Page -------------------
        $scope.projects = [];
        $scope.project = null;
        $scope.selectedProjectName = null;
        $scope.testTree = [];
        $scope.testcaseList = {};
        window.testTree = $scope.testTree;


        // determine if we have a pre-selected project
        if ($routeParams['project']) {
            $scope.selectedProjectName = $routeParams['project'];
            $cookies.put('slick-last-project-used', $routeParams['project']);
        } else if ($cookies.get('slick-last-project-used')) {
            $scope.selectedProjectName =  $cookies.get('slick-last-project-used');
        }

        // Get the list of projects, sorted by last updated
        projrest.all('projects').getList({orderby: '-lastUpdated'}).then(function(projects) {
            $scope.projects = projects;
            if ($scope.selectedProjectName) {
                $scope.project = _.find($scope.projects, function(project) { return project.name == $scope.selectedProjectName; });
            } else {
                // auto-select the most recently updated project
                $scope.project = $scope.projects[0];
            }
            _.each($scope.project.components, function(component) {
                $scope.testcaseList[component.id] = {};
                var copy = _.cloneDeep(component);
                $scope.testTree.push(copy);
                rest.all('testcases').getList({q: 'and(eq(project.id,"' + $scope.project.id + '"),eq(component.id,"' + copy.id + '"),not(exists(feature,true)))'}).then(function(testcases) {
                    copy.testcases = testcases;
                });
                _.each(copy.features, function(feature) {
                    $scope.testcaseList[feature.id] = {};
                    rest.all('testcases').getList({q: 'and(eq(project.id,"' + $scope.project.id + '"),eq(component.id,"' + copy.id + '"),eq(feature.id,"' + feature.id + '"))'}).then(function(testcases) {
                        feature.testcases = testcases;
                    });
                });
            })
        });


        // --------------- Response Functions ------------------

        $scope.selectProject = function(project) {
            $location.search({project: project.name});
        };

        window.scope = $scope;

    }]);

