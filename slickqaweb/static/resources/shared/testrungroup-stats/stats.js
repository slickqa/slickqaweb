/**
 * User: jcorbett
 * Date: 11/28/13
 * Time: 7:45 PM
 */

angular.module("slickApp")
    .directive("slickTestrunGroupStats", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrungroup-stats/stats.html",
            scope: {
                testrungroup: "="
            }
        };
    });
