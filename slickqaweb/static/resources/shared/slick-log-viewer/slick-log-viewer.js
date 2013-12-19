/**
 * User: jcorbett
 * Date: 12/18/13
 * Time: 10:14 PM
 */

angular.module('slickApp')
    .directive('slickLogViewer', function() {
        return {
            restrict: 'E',
            transclude: false,
            templateUrl: 'static/resources/shared/slick-log-viewer/slick-log-viewer.html',
            replace: true,
            scope: {
                logs: "="
            },
            link: function(scope, element, attrs) {
                scope.logList = {};
            }
        };
    });
