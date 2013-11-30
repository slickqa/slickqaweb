/**
 * User: jcorbett
 * Date: 11/28/13
 * Time: 7:45 PM
 */

angular.module("slickApp")
    .directive("slickTestrunStats", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrun-stats/stats.html",
            scope: {
                testrun: "="
            }
        };
    });
