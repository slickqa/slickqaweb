/**
 * User: jcorbett
 * Date: 12/16/13
 * Time: 6:27 PM
 */

angular.module("slickApp")
    .directive('prettyprint', function() {
        return {
            restrict: 'A',
            terminal: true,
            scope: {
                code: "="
            },
            link: function($scope, $el) {
                $scope.$watch('code', function() {
                    $el.text($scope.code);
                    $el.html(prettyPrintOne($el.html()));
                });
            }
        };
    });
