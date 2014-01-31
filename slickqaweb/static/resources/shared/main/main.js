'use strict';

angular.module('slickApp')
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'static/resources/shared/main/main.html',
        controller: 'MainCtrl'
      });
  }])
  .controller('MainCtrl', ['$scope', 'Restangular', function ($scope, rest) {
        $scope.testrunTableOne = {};
        $scope.testrunTableTwo = {};
        $scope.testrunListOne = [];
        $scope.testrunListTwo = [];

        $scope.testrungroupTableOne = {};
        $scope.testrungroupTableTwo = {};
        $scope.testrungroupListOne = [];
        $scope.testrungroupListTwo = [];

        $scope.buildTableOne = {};
        $scope.buildTableTwo = {};
        $scope.buildListOne = [];
        $scope.buildListTwo = [];


        $scope.fetchData = function() {
            rest.all('testruns').getList({orderby: '-dateCreated', limit: 10}).then(function(testruns) {
                $scope.testrunListOne = testruns.splice(0, 5);
                $scope.testrunListTwo = testruns;
            });
            rest.all('testrungroups').getList({orderby: '-created', limit: 10}).then(function(testrungroups) {
                $scope.testrungroupListOne = testrungroups.splice(0,5);
                $scope.testrungroupListTwo = testrungroups;
            });

            // recent builds are a little tricky
            var buildList = [];
            rest.all('projects').getList().then(function(projects) {
                _.each(projects, function(project) {
                    _.each(project.releases, function(release) {
                        _.each(release.builds, function(build) {
                            // This creates a flat list that we can sort
                            buildList.push({build: build, project: project, release: release});
                        });
                    });
                });

                buildList = _.sortBy(buildList, function(build) {
                    return build.build.built;
                });
                buildList.reverse();


                _.each(buildList.slice(0, 10), function(buildInfo, index) {
                    rest.one('build-report', buildInfo.project.name).one(buildInfo.release.name, buildInfo.build.name).get().then(function(buildReport) {
                        buildInfo.report = buildReport;
                    });
                    if (index < 5) {
                        $scope.buildListOne[index] = buildInfo;
                    } else {
                        $scope.buildListTwo[index - 5] = buildInfo;
                    }
                });
            });
        };

        $scope.fetchData();
        window.scope = $scope;
  }]);
