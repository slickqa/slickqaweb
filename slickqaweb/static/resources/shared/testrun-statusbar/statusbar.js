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
                scope.setStats = function () {
                    scope.stats = [];

                    _.each(scope.summary.statusListOrdered, function(statusName) {
                        scope.stats.push({name: statusName,
                            width: ((scope.summary.resultsByStatus[statusName] / scope.summary.total) * 100).toFixed(0)});
                    });
                };
                scope.setStats();
                scope.$watch('summary', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.setStats();
                    }
                });
            }

        };
    });
