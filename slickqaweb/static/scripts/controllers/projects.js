/**
 * User: jcorbett
 * Date: 6/27/13
 * Time: 2:59 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/projects', {
                templateUrl: 'static/views/projects.html',
                controller: 'ProjectsCtrl'
            })
            .when('/projects/:name', {
                templateUrl: 'static/views/view-project.html',
                controller: 'ViewAndUpdateProjectCtrl'
            });
        nav.addLink('Project Management', 'Projects', 'projects')
    }])
    .controller('ProjectsCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', function ($scope, rest, nav) {
        $scope.project = {
            name: "",
            description: ""
        };

        $scope.showAddProject = false;
        $scope.addProject = function() {
            $scope.showAddProject = !$scope.showAddProject;
        };

        $scope.addProjectDialogButtonClicked = function(buttonName) {
            if(buttonName != 'Cancel') {
                rest.all('projects').post($scope.project).then(function() {
                    $scope.project.name = "";
                    $scope.project.description = "";
                    rest.all('projects').getList().then(function(projects) {
                        $scope.projects = projects;
                    });
                });
            }
            $scope.addProject();
        };

        rest.all('projects').getList().then(function(projects) {
            $scope.projects = projects;
            nav.setTitle("Slick Projects (" + projects.length + ")");
        });
        $scope.projectList = {}; // Model for the list header and filter
    }])
    .controller('ViewAndUpdateProjectCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$routeParams', '$cookieStore', function($scope, rest, nav, $routeParams, $cookieStore) {
        $scope.showAddComponent = false;
        $scope.component = {
            name: "",
            code: ""
        };

        $scope.addComponent = function() {
            $scope.showAddComponent = !$scope.showAddComponent;
        };

        $scope.$watch('component.name', function() {
            $scope.component.code = $scope.component.name.toLowerCase().replace(/ /g, "-");
        });

        $scope.dialogButtonClicked = function(buttonName) {
            if(buttonName == "Add") {
                if(! $scope.project.components) {
                    $scope.project.components = [];
                }
                $scope.project.components.push({ name: String($scope.component.name), code: String($scope.component.code), id: (new ObjectId()).toString()});
                $scope.projectForm.$setDirty();
            } else {
                //Cancel button was clicked
            }
            $scope.component.name = "";
            $scope.component.code = "";
            $scope.addComponent();
        };

        rest.one('projects', $routeParams.name).get().then(function(project) {
            $cookieStore.put('slick-last-project-used', project.name);
            $scope.project = project;
            nav.setTitle($scope.project.name);
            if(project.releases && project.releases.length > 0) {
                $scope.selectedRelease = project.releases[0].id;
            }
        });

        $scope.isSelectedRelease = function(releaseId) {
            if(releaseId == $scope.selectedRelease) {
                return "project-release-selected";
            } else {
                return "";
            }
        };

        $scope.selectRelease = function(releaseId) {
            $scope.selectedRelease = releaseId;
        };

        $scope.save = function() {
            $scope.project.put().then(function(project) {
                $scope.project = project;
                $scope.projectForm.$setPristine();
            });
        }
    }]);
