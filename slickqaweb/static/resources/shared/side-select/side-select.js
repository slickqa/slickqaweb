/**
 * User: jcorbett
 * Date: 11/26/13
 * Time: 4:05 PM
 */


angular.module("slickApp")
    .directive("slickSideSelect", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/side-select/side-select.html",
            scope: {
                model: "=",
                options: "=",
                display: "@",
                label: "@"
            },

            link: function(scope, element, attrs) {
                scope.selection = false;
                scope.showSelection = function() {
                    scope.selection = true;
                };
                scope.selectOption = function(option) {
                    scope.model = option;
                    scope.selection = false;
                };
            }

        }
    });
