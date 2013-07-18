/**
 * Created with IntelliJ IDEA.
 * User: jcorbett
 * Date: 7/13/13
 * Time: 5:11 PM
 * To change this template use File | Settings | File Templates.
 */

'use strict';

describe('HeaderCtrl (from header.js)', function() {
    var $scope = null;
    var headerctrl = null;
    var navservice = {
        show: function() {
        },
        toggleShow: function() {
        },
        getTitle: function() {
        },
        setTitle: function(title) {
        }
    };

    var event = {
        preventDefault: function() {
        }
    };

    beforeEach(angular.mock.module('slickPrototypeApp'));
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
        $scope = $rootScope.$new();
        headerctrl = $controller('HeaderCtrl', {
            $scope: $scope,
            NavigationService: navservice
        });
    }));

    it('Should provide a getTitle method, that returns the navigation service\'s getTitle result.', function() {
        var title = 'Unittest Title';
        spyOn(navservice, 'getTitle').andReturn(title);
        expect($scope).has('getTitle', "HeaderCtrl->$scope");
        expect($scope.getTitle()).toBe(title);
        expect(navservice.getTitle).toHaveBeenCalled();
    });

    it('Should call NavigationService.toggleShow() when showNav is called', function() {
        spyOn(navservice, 'toggleShow');
        $scope.showNav(event);
        expect(navservice.toggleShow).toHaveBeenCalled();
    });

    it('Should call toggleShow() on $routeChangeSuccess if menu is shown.', function() {
        spyOn(navservice, 'show').andReturn(true);
        spyOn(navservice, 'toggleShow');
        $scope.$broadcast("$routeChangeSuccess");
        expect(navservice.show).toHaveBeenCalled();
        expect(navservice.toggleShow).toHaveBeenCalled();
    });

    it('Should not call toggleShow() on $routeChangeSuccess if menu is not currently shown.', function() {
        spyOn(navservice, 'show').andReturn(false);
        spyOn(navservice, 'toggleShow');
        $scope.$broadcast("$routeChangeSuccess");
        expect(navservice.show).toHaveBeenCalled();
        expect(navservice.toggleShow).not.toHaveBeenCalled();
    });

    it('Should set title to "Slick" on $routeChangeSuccess', function() {
        spyOn(navservice, 'setTitle');
        $scope.$broadcast("$routeChangeSuccess");
        expect(navservice.setTitle).toHaveBeenCalledWith("Slick");
    });

});
