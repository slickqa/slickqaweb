/**
 * User: jcorbett
 * Date: 8/18/13
 * Time: 11:40 AM
 */


'use strict';

describe('UserService (from current-user.js)', function() {
    var Restangular = {
        oneFirstParam: undefined,
        oneSecondParam: undefined,

        one: function(name0, name1) {
            Restangular.oneFirstParam = name0;
            Restangular.oneSecondParam = name1;

            return Restangular;
        },

        thenCallbackSetup: {
            callFirstCallback: false,
            firstCallbackObject: {}
        },
        then: function(callback1, callback2) {
            if(Restangular.thenCallbackSetup.callFirstCallback) {
                callback1(Restangular.thenCallbackSetup.firstCallbackObject);
            } else
            {
                callback2();
            }
        },
        get: function() {
            return Restangular;
        },
        reset: function() {
            Restangular.oneFirstParam = undefined;
            Restangular.oneSecondParam = undefined;
            Restangular.thenCallbackSetup.callFirstCallback = false;
            Restangular.thenCallbackSetup.firstCallbackObject = {};
        }
    };
    var user = {};

    beforeEach(angular.mock.module('slickTestModule', function($provide) {
        $provide.value('Restangular', Restangular);
    }));

    beforeEach(angular.mock.inject(function(UserService) {
        user = UserService;
    }));

    afterEach(function() {
        Restangular.reset();
    });

    it("Should provide an empty currentUser", function() {
        expect(user.currentUser).toBeDefined();
    });

    it("Should call getCurrentUser when refresh is called.", function() {
        spyOn(user, 'getCurrentUser');
        user.refresh();
        expect(user.getCurrentUser).toHaveBeenCalled();
    });

    it("Should update the currentUser object (not replace it) when a user is returned from api/users/current", function() {
        Restangular.thenCallbackSetup.callFirstCallback = true;
        Restangular.thenCallbackSetup.firstCallbackObject = {foo: 'bar'};
        var currentUser = user.currentUser;
        expect(currentUser).not.has('foo', 'user.currentUser');
        user.getCurrentUser();
        expect(currentUser).has('foo', 'user.currentUser');
        expect(currentUser.foo).toBe('bar');
    });

    it("Should empty the currentUser object (not replace it) when api/users/current resturns an error", function() {
        user.currentUser.foo = 'bar';
        var currentUser = user.currentUser;
        expect(currentUser).has('foo', 'user.currentUser');
        expect(currentUser.foo).toBe('bar');
        user.getCurrentUser();
        expect(currentUser).not.has('foo', 'user.currentUser');
    });

});

