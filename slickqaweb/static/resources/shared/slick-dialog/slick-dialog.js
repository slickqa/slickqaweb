/**
 * User: jcorbett
 * Date: 8/8/13
 * Time: 3:53 PM
 */

angular.module("slickApp")
    .directive("slickDialog", function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: "static/resources/shared/slick-dialog/slick-dialog.html",
            scope: {
                show: "=",
                title: "@",
                size: "@",
                buttons: "@",
                buttonCallback: "&"
            },

            link: function(scope, element, attrs) {
                scope.buttonNames = scope.buttons.split("|");
            }

        }
    });
