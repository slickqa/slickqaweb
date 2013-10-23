/**
 * User: jcorbett
 * Date: 9/24/13
 * Time: 12:59 PM
 */


angular.module('slickApp')
    .directive('slickDatePicker', ['$parse', function($parse) {
        return {
            restrict: 'E',
            template: '<div class="slick-date-picker"><div class="slick-date-picker-transclude" ng-click="toggleShow()" ng-transclude></div><div class="slick-date-picker-calendar" ng-show="show"></div></div>',
            transclude: true,
            replace: true,
            link: function postLink(scope, element, attrs) {
                var model = attrs.ngModel,
                    formName = attrs.form,
                    calendar = new Kalendae(element[0].children[1],{selected: new Kalendae.moment($parse(model)(scope))});
                calendar.subscribe("change", function(value) {
                    scope.$apply(scope.toggleShow);
                });
                scope.show = false;
                scope.toggleShow = function() {
                    if(scope.show) {
                        $parse(model).assign(scope, calendar.getSelectedRaw()[0].valueOf());
                        if(formName) {
                            $parse(formName)(scope).$setDirty();
                        }
                    }
                    scope.show = !scope.show;
                };
            }
        };
    }]);
