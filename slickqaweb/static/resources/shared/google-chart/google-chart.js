/**
 * User: jcorbett
 * Date: 12/1/13
 * Time: 10:27 PM
 */


angular.module('slickApp')
    .directive('googlePieChart', function() {
        return {
            restrict: 'E',
            transclude: false,
            template: '<div class="google-pie-chart"></div>',
            replace: true,
            scope: {
                data: "=",
                options: "="
            },
            link: function postLink(scope, element, attrs) {
                var chart = new google.visualization.PieChart(element[0]);
                chart.draw(scope.data, scope.options);

                scope.$watch('data', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
                scope.$watch('options', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
            }
        };
    })
    .directive('googleBarChart', function() {
        return {
            restrict: 'E',
            transclude: false,
            template: '<div class="google-bar-chart"></div>',
            replace: true,
            scope: {
                data: "=",
                options: "="
            },
            link: function postLink(scope, element, attrs) {
                var chart = new google.visualization.BarChart(element[0]);
                chart.draw(scope.data, scope.options);

                scope.$watch('data', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
                scope.$watch('options', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
            }
        };
    })
    .directive('googleColumnChart', function() {
        return {
            restrict: 'E',
            transclude: false,
            template: '<div class="google-column-chart"></div>',
            replace: true,
            scope: {
                data: "=",
                options: "="
            },
            link: function postLink(scope, element, attrs) {
                var chart = new google.visualization.ColumnChart(element[0]);
                chart.draw(scope.data, scope.options);

                scope.$watch('data', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
                scope.$watch('options', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
            }
        };
    })
    .directive('googleLineChart', function() {
        return {
            restrict: 'E',
            transclude: false,
            template: '<div class="google-line-chart"></div>',
            replace: true,
            scope: {
                data: "=",
                options: "="
            },
            link: function postLink(scope, element, attrs) {
                var chart = new google.visualization.LineChart(element[0]);
                chart.draw(scope.data, scope.options);

                scope.$watch('data', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
                scope.$watch('options', function(newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
            }
        };
    });
