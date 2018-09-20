/**
 * User: steve.jensen
 * Date: 9/18/2018
 * Time: 4:14 PM
 */


angular.module("slickApp")
    .directive("pipeline", function () {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/pipeline/pipeline.html",
            scope: {
                data: "=",
                size: "@"
            },

            link: function (scope, element, attrs, ctrls) {
                scope.replaceOnStatus = replaceOnStatus;
                scope.statusToColor = statusToColor;
                scope.phaseTypeToIcon = phaseTypeToIcon;
                scope.getDurationString = getDurationString;
                scope.setStats = function () {

                    scope.phases = [];
                    _.each(scope.data.phases, function (phase) {
                        phase.width = ((phase.duration / scope.data.duration) * 100).toFixed(0);
                        scope.phases.push(phase);
                    });
                };
                scope.setStats();
                scope.$watch('data', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.setStats();
                    }
                });
            }
        }
    });
