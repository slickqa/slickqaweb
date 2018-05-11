/**
 * User: jcorbett
 * Date: 7/23/13
 * Time: 5:29 PM
 */

angular.module('slickTestModule', ['slickApp']);
/**
 *
 * This file is NOT A TEST.  It is actually a angularjs controller for a view that will run the unit tests from
 * a running slick.  It's placed in the jstests directory because we only want it included in when tests are available.
 *
 * User: jcorbett
 * Date: 7/15/13
 * Time: 3:23 PM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/unittests/javascript', {
                templateUrl: 'static/resources/pages/unittest/unittests-javascript.html',
                controller: 'UnitTestsJavascriptCtrl'
            })
            .when('/unittests/python', {
                templateUrl: 'static/resources/pages/unittest/unittests-python.html',
                controller: 'UnitTestsPythonCtrl'
            });
        nav.addSection('Slick Testing', false, 'slick-testing.png');
        nav.addLink('Slick Testing', 'Javascript Unit Tests', 'unittests/javascript');
        nav.addLink('Slick Testing', 'Python Unit Tests', 'unittests/python');
    }])
    .controller('UnitTestsJavascriptCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        nav.setTitle("Javascript Unit Tests for Slick");
        $scope.results = {
            totalrun: 0,
            totalpassed: 0,
            totalfailed: 0,
            passed: [],
            failed: [],
            state: "NOT RUN"
        };

        $scope.summarize = function(suite, context) {
            if(context === null) {
                context = suite.description;
            } else {
                context = context + " -> " + suite.description;
            }
            _.each(suite.suites, function(childsuite) {
                $scope.summarize(childsuite, context);
            });

            _.each(suite.specs, function(spec) {
                $scope.results.totalrun++;
                if(spec.passed) {
                    $scope.results.totalpassed++;
                    $scope.results.passed.push({path: context, name: spec.description})
                } else {
                    $scope.results.totalfailed++;
                    $scope.results.failed.push({path: context, name: spec.description, message: spec.message})
                }
            })

        };

        $scope.runTests = function() {
            var env = jasmine.getEnv();
            var jsreporter = new jasmine.JSReporter();
            jsreporter.callbacks.push(function() {
                $scope.$apply(function() {
                    var jresults = jasmine.getJSReport();
                    _.each(jresults.suites, function(suite) {
                        $scope.summarize(suite, null);
                    });
                    $scope.results.state = "FINISHED";
                });
            });
            env.addReporter(jsreporter);
            $scope.results.state = "RUNNING";
            env.execute();
            console.log("Running Tests")
        };

        $scope.runTests();
        window.gscope = $scope;
    }])
    .controller('UnitTestsPythonCtrl', ['$scope', '$resource', 'NavigationService', function($scope, $resource, nav) {
        nav.setTitle("Python Unit Tests for Slick");
        var unittestresource = $resource('api/unittests');
        $scope.results = unittestresource.get();
    }])
    .controller('UnittestResultCtrl', ['$scope', function ($scope) {
        $scope.getOverallResult = function() {
            if($scope.results.state != "FINISHED") {
                return $scope.results.state;
            } else if($scope.results.totalrun == 0) {
                return "NO RESULTS";
            } else if($scope.results.totalpassed == $scope.results.totalrun) {
                return "PASSED";
            } else {
                return "FAILED";
            }
        };
        $scope.showPassed = false;
        $scope.showFailed = true;

        $scope.toggleShow = function(name) {
            if(name == "passed") {
                if($scope.showPassed) {
                    $scope.showPassed = false;
                } else {
                    $scope.showPassed = true;
                }
            } else if(name == "failed") {
                if($scope.showFailed) {
                    $scope.showFailed = false;
                } else {
                    $scope.showFailed = true;
                }
            }
        }

    }]);
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

    beforeEach(angular.mock.module('slickTestModule'));
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
/**
 * User: jcorbett
 * Date: 7/18/13
 * Time: 12:18 PM
 */


'use strict';

describe('NavigationService (from slick-navigation.js)', function() {
    var navservice = {};
    var cookiestore = {
        get: function() {
        },
        put: function() {
        }
    };

    var window = {
        document: {
            title: "foo"
        }
    };

    beforeEach(angular.mock.module('slickTestModule', function($provide) {
        $provide.value('$cookieStore', cookiestore);
        $provide.value('$window', window);
    }));

    beforeEach(angular.mock.inject(function(NavigationService) {
        navservice = NavigationService;
    }));

    it('Should have a title set to "Slick" initially', function() {
        expect(navservice.getTitle()).toBe("Slick");
    });

    it('Should allow a title to be set', function() {
        expect(navservice.getTitle()).not.toBe("A New Title");
        navservice.setTitle("A New Title");
        expect(navservice.getTitle()).toBe("A New Title");
    });

    it('Should set the title of the document when a title is set.', function() {
        window.document.title = "foo";
        expect(window.document.title).toBe('foo');
        navservice.setTitle("Bar");
        expect(window.document.title).toBe("Bar");
    });

    it('show() should get it\'s value from cookieStore', function() {
        spyOn(cookiestore, 'get').andReturn(true);
        expect(navservice.show()).toBe(true);
        expect(cookiestore.get).toHaveBeenCalled();
    });

    it('toggleShow should change the nav-show cookie value from true to false.', function() {
        spyOn(cookiestore, 'get').andReturn(true);
        spyOn(cookiestore, 'put');
        navservice.toggleShow();
        expect(cookiestore.get).toHaveBeenCalled();
        expect(cookiestore.put).toHaveBeenCalledWith('nav-show', false);
    });

    it('toggleShow should change the nav-show cookie value from false to true.', function() {
        spyOn(cookiestore, 'get').andReturn(false);
        spyOn(cookiestore, 'put');
        navservice.toggleShow();
        expect(cookiestore.get).toHaveBeenCalled();
        expect(cookiestore.put).toHaveBeenCalledWith('nav-show', true);
    });

    it('mode() should get it\'s value from cookieStore', function() {
        spyOn(cookiestore, 'get').andReturn('pinned');
        expect(navservice.mode()).toEqual('pinned');
        expect(cookiestore.get).toHaveBeenCalled();
    });

    it('toggleMode should change the nav-mode cookie value from pinned to overlay.', function() {
        spyOn(cookiestore, 'get').andReturn('pinned');
        spyOn(cookiestore, 'put');
        navservice.toggleMode();
        expect(cookiestore.get).toHaveBeenCalled();
        expect(cookiestore.put).toHaveBeenCalledWith('nav-mode', 'overlay');
    });

    it('toggleMode should change the nav-mode cookie value from overlay to pinned.', function() {
        spyOn(cookiestore, 'get').andReturn('overlay');
        spyOn(cookiestore, 'put');
        navservice.toggleMode();
        expect(cookiestore.get).toHaveBeenCalled();
        expect(cookiestore.put).toHaveBeenCalledWith('nav-mode', 'pinned');
    });

    it('Should have pre-defined sections.', function() {
        var sections = navservice.sections();
        expect(sections).toBeDefined();
        expect(sections).toBeArray();
        expect(sections.length).toBeGreaterThan(0);
        expect(sections).toContainObjectWithProperty("name", "Bookmarks");
        expect(sections).toContainObjectWithProperty("name", "Reports");
        expect(sections).toContainObjectWithProperty("name", "Settings");
        expect(sections).toContainObjectWithProperty("name", "Dashboards");
        expect(sections).toContainObjectWithProperty("name", "Run Tests");
        expect(sections).toContainObjectWithProperty("name", "Project Management");
        expect(sections).toContainObjectWithProperty("name", "Test Management");
    });

    it('Should allow you to get a section by name', function() {
        var sectionName = "Bookmarks";
        expect(navservice.getSection(sectionName)).has("name", sectionName);
        sectionName = "Reports";
        expect(navservice.getSection(sectionName)).has("name", sectionName);
    });

    it('Should allow you to add a section and then retrieve it.', function() {
        var newSectionName = "New Section Name";
        var iconUrl = "icons/new-section-name.png";
        navservice.addSection(newSectionName, true, iconUrl);
        expect(navservice.getSection(newSectionName)).has("name", "section");
        expect(navservice.getSection(newSectionName)).has("icon", "section");
    });

    it('Should allow you to add a link to a section that exists', function() {
        var linkName = "A Link";
        var linkUrl = "a/link";
        var expectedobj = {name: linkName, url: linkUrl};
        expect(navservice.getSection("Bookmarks").links).not.toContain(expectedobj);
        navservice.addLink("Bookmarks", linkName, linkUrl);
        expect(navservice.getSection("Bookmarks").links).toContain(expectedobj);
    });

    it('Should allow you to add a link to a section that does not exist (it get\'s added).', function() {
        var linkName = "A Link";
        var linkUrl = "a/link";
        var expectedobj = {name: linkName, url: linkUrl};
        var sectionName = "New Section";
        expect(navservice.getSection(sectionName)).toBeUndefined();
        navservice.addLink(sectionName, linkName, linkUrl);
        expect(navservice.getSection(sectionName)).toBeDefined();
        expect(navservice.getSection(sectionName).links).toContain(expectedobj);
    });

});
/**
 * User: jcorbett
 * Date: 7/18/13
 * Time: 12:41 PM
 */

"use strict";

beforeEach(function() {
    this.addMatchers({
        has: function(expected, name) {
            var actual = this.actual;
            if(name === undefined) {
                name = "" + actual;
            }

            var notText = this.isNot ? " not" : "";

            this.message = function () {
                return "Expected " + name + notText + " to have key " + expected;
            };

            return _.has(actual, expected);
        },

        toContainObjectWithProperty: function(propertyname, propertyvalue) {
            var actual = this.actual;
            var notText = this.isNot ? " not" : "";
            var valueText = "";
            if(propertyvalue !== undefined) {
                valueText = " and value " + propertyvalue;
            }

            this.message = function() {
                return "Expected " + actual + notText + " to have property with name " + propertyname + valueText + ".";
            };
            var found = false;
            _.each(actual, function(actualItem) {
                if(_.has(actualItem, propertyname)) {
                    if(propertyvalue !== undefined) {
                        if(actualItem[propertyname] == propertyvalue) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                }
            });
            return found;
        }

    });
});
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

