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
                summary: "=",
                size: "@"
            },

            link: function(scope, element, attrs, ctrls) {
                if (scope.size != "large" && scope.size != "normal") {
                    scope.size = "normal";
                }
                scope.stats = [];

                //TODO: it would be good to get the width from css instead of defining it both places
                var totalWidth = 1.8;
                if (scope.size == "normal") {
                    totalWidth = 1.0;
                }
                _.each(scope.summary.statusListOrdered, function(statusName) {
                    scope.stats.push({name: statusName,
                                      width: ((scope.summary.resultsByStatus[statusName] / scope.summary.total) * totalWidth).toFixed(2)});
                });
            }

        };
    });
