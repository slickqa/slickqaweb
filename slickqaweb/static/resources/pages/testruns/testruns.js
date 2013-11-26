/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testruns', {
                templateUrl: 'static/resources/pages/testruns/testrun-list.html',
                controller: 'TestrunListCtrl'
            });
        nav.addLink('Reports', 'Testrun List', 'testruns');
    }])
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookieStore', '$location', function ($scope, rest, nav, $routeParams, $cookieStore, $location) {
        if (!$routeParams["project"] && $cookieStore.get('slick-last-project-used')) {
            $location.search("project", $cookieStore.get('slick-last-project-used'));
        }
        nav.setTitle("Testruns");
        $scope.testruns = [];

        var testrunQuery = [];
        if ($routeParams["project"]) {
            testrunQuery.push("eq(project.name,\"" + $routeParams.project + "\")");
        }

        var q = "";
        if (testrunQuery.length > 1) {
            q = "and(";
        }
        q = q + testrunQuery.join();
        if (testrunQuery.length > 1) {
            q = q + ")";
        }
        if (!q) {
            rest.all('testruns').getList().then(function(testruns) {
                $scope.testruns = testruns;
                window.testruns = testruns;
            });
        } else {
            rest.all('testruns').getList({q: q}).then(function(testruns) {
                $scope.testruns = testruns;
                window.testruns = testruns;
            });
        }
        $scope.testrunList = {}; // Model for the list header and filter

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        }
    }]);

