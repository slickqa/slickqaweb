/**
 * User: jcorbett
 * Date: 6/27/13
 * Time: 2:59 PM
 */
"use strict";

angular.module('slickPrototypeApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/projects', {
                templateUrl: 'views/projects.html',
                controller: 'ProjectsCtrl'
            });
        nav.addLink('Project Management', 'Projects', 'projects')
    }])
    .controller('ProjectsCtrl', ['$scope', 'Project', function ($scope, Project) {
        $scope.projects = Project.query();
    }]);
