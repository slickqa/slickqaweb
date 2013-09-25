/**
 * User: jcorbett
 * Date: 9/23/13
 * Time: 10:43 AM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/releases', {
                templateUrl: 'static/views/releases.html',
                controller: 'ReleasesCtrl'
            });

        // add links in the left side navigation menu
        nav.addLink('Project Management', 'Releases', 'releases');
        nav.addLink('Project Management', 'Add Release', 'releases?add=true');
    }])
    .controller('ReleasesCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$cookieStore', '$routeParams', function ($scope, rest, nav, $cookie, $routeParams) {
        $scope.model = {};
        $scope.model.projects = [];

        $scope.model.project = {};

        $scope.newRelease = {
            name: '',
            target: (new Date()).valueOf()
        };

        $scope.showAddRelease = false;
        if($routeParams.add) {
            $scope.showAddRelease = true;
        }

        $scope.toggleAddRelease = function() {
            $scope.showAddRelease = ! $scope.showAddRelease;
        };

        $scope.addReleaseDialogButtonClicked = function(buttonName) {
            if(buttonName == 'Add') {
                $scope.model.project.releases.push({id: (new ObjectId()).toString(),
                                              name: $scope.newRelease.name,
                                              target: $scope.newRelease.target,
                                              status: 'active'});
                $scope.releasesForm.$setDirty();
                $scope.newRelease.name = '';
                $scope.newRelease.target = (new Date()).valueOf();
            }
            $scope.toggleAddRelease();
        };


        // this is used by the list on the page
        $scope.releaseList = {};

        $scope.getProjects = function() {
            // lookup a list of all projects, and update the scope variables
            rest.all('projects').getList().then(function(projects) {
                $scope.model.projects = projects;

                // grab the last project used from the cookie
                $scope.lastProjectUsed = $cookie.get('slick-last-project-used');

                // this section loops through to find the last project selected, and makes it the default selected one
                // in the ui.  It does this by setting $scope.project to that value.
                _.each(projects, function(proj) {
                    if(proj.name == $scope.lastProjectUsed) {
                        $scope.model.project = proj;
                    }
                });
            });
        };
        $scope.getProjects();


        // when they select a different project (placing the new value in $scope.project) then set the cookie
        // to the latest value
        $scope.$watch('model.project', function(newValue, oldValue) {
            if(newValue.name) {
                $cookie.put('slick-last-project-used', newValue.name);
            }
        });

        $scope.save = function() {
            $scope.model.project.put().then(function(project) {
                $scope.getProjects();
                $scope.releasesForm.$setPristine();
            });
        }

    }]);
