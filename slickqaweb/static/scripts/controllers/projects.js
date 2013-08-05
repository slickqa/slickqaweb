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
    .controller('ProjectsCtrl', ['$scope', 'Project', function ($scope, Project) {
        $scope.projects = Project.query();
        $scope.projectList = {}; // Model for the list header and filter
        window.projscope = $scope;
    }])
    .controller('ViewAndUpdateProjectCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$routeParams', function($scope, rest, nav, $routeParams) {
        rest.one('projects', $routeParams.name).get().then(function(project) {
            $scope.project = project;
            nav.setTitle($scope.project.name);
        });

        $scope.save = function() {
            $scope.project.put().then(function(project) {
                $scope.project = project;
                $scope.projectForm.$setPristine();
            });
        }
    }]);
