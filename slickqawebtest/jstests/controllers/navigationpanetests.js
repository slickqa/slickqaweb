/**
 * User: jcorbett
 * Date: 7/22/13
 * Time: 10:08 AM
 */

describe('NavCtrl (from navigationpage.js)', function() {
    var $scope = null;
    var navctrl = null;

    var navservice = {
        toggleMode: function() {
        }
    };

    var event = {
        preventDefault: function() {
        }
    };

    beforeEach(angular.mock.module('slickTestModule'));
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
        $scope = $rootScope.$new();
        navctrl = $controller('NavCtrl', {
            $scope: $scope,
            NavigationService: navservice
        });
    }));

    it('Should allow the navigation mode to toggle, and prevent the default event action.', function() {
        spyOn(navservice, 'toggleMode');
        spyOn(event, 'preventDefault');
        $scope.toggleMode(event);
        expect(navservice.toggleMode).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('Should set a group\'s show property to false when toggleShow is called when it is true.', function() {
        var group = { show: true };
        spyOn(event, 'preventDefault');
        $scope.toggleShow(group, event);
        expect(group.show).toBe(false);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('Should set a group\'s show property to true when toggleShow is called when it is false.', function() {
        var group = { show: false };
        spyOn(event, 'preventDefault');
        $scope.toggleShow(group, event);
        expect(group.show).toBe(true);
        expect(event.preventDefault).toHaveBeenCalled();
    });
});
