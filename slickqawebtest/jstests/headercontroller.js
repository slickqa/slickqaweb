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
    var show = false;
    var navservice = {
        show: function() {
            return show;
        },
        toggleShow: function() {
            if(show) {
                show = false;
            } else {
                show = true;
            }
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

    it('Should set the title to "Slick" initially', function() {
        expect($scope.title).toEqual("Slick");
    });

    it('Should call NavigationService.toggleShow() when showNav is called', function() {
        spyOn(navservice, 'toggleShow');
        $scope.showNav(event);
        expect(navservice.toggleShow).toHaveBeenCalled();
    });

    it('Will always fail', function() {
        expect(false).toBe(true);
    });
});
