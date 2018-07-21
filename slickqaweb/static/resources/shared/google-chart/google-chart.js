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
                function goToResults() {
                    var selectedItem = chart.getSelection()[0];
                    if (selectedItem) {
                        var status = scope.data.getValue(selectedItem.row, 0);
                        if (window.location.pathname.indexOf('build-report') > -1) {
                            window.location.href = window.location.pathname.replace('build-report', 'result-list') + '?status=' + status.replace(/ /g, "_")
                        }
                    }
                }
                google.visualization.events.addListener(chart, 'select', goToResults);
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
                function goToBuildReport() {
                    var selectedItem = chart.getSelection()[0];
                    if (selectedItem) {
                        var properties = scope.data.getRowProperties(selectedItem.row);
                        if (properties.project) {
                            window.location.href = ['build-report', properties.project, properties.release, properties.build].join('/')
                        } else if(properties.testrun) {
                            window.location.href = ['testruns', properties.testrun].join('/')
                        }
                    }
                }
                google.visualization.events.addListener(chart, 'select', goToBuildReport);
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
