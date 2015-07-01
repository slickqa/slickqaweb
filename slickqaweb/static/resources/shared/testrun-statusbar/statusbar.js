/**
 * User: jcorbett
 * Date: 11/23/13
 * Time: 9:15 PM
 */


angular.module("slickApp")
    .directive("slickTestrunStatusbar", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrun-statusbar/statusbar.html",
            scope: {
                testrun: "=",
                summaryName: "@",
                size: "@"
            },

            link: function(scope, element, attrs, ctrls) {
                if (scope.size != "large" && scope.size != "normal") {
                    scope.size = "normal";
                }
                scope.stats = [];

                if (! scope.summaryName ) {
                    scope.summaryName = "summary";
                }

                scope.summary = scope.testrun[summaryName];
                _.each(scope.summary.statusListOrdered, function(statusName) {
                    scope.stats.push({name: statusName,
                                      width: ((scope.summary.resultsByStatus[statusName] / scope.summary.total) * 100).toFixed(0)});
                });
            }

        };
    });
