'use strict';

var _replace_underscore_regexp = new RegExp('_', 'g')

function replaceOnStatus(status, replace_with) {
    return status.replace(_replace_underscore_regexp, replace_with)
}

angular.module('slickApp', [ 'ngAnimate', 'ngRoute', 'ngResource', 'ngCookies', 'restangular', 'ngSanitize' ])
  .config(['$locationProvider', 'RestangularProvider', function ($locationProvider, RestangularProvider) {
    $locationProvider.html5Mode(true);
    RestangularProvider.setBaseUrl("api/");
  }]);

angular.module('slickLoginApp', []);

function getStyle(el,styleProp)
{
    var x = document.getElementById(el);
    if (x.currentStyle)
        var y = x.currentStyle[styleProp];
    else if (window.getComputedStyle)
        var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
    return y;
}

function getDurationString(duration, doNotShowDecimals) {
    if (duration !== Infinity) {
        var seconds = duration / 1000.0;
        var minutes = 0;
        var hours = 0;
        var days = 0;
        var retval = "";

        if (seconds > 60) {
            minutes = Math.floor(seconds / 60);
            seconds = doNotShowDecimals ? Math.floor((seconds % 60)) + " seconds" : (seconds % 60).toFixed(3) + " seconds"
        } else {
            seconds = doNotShowDecimals ? Math.floor(seconds) + " seconds" : seconds.toFixed(3) + " seconds";
        }

        if (minutes > 60) {
            hours = Math.floor(minutes / 60);
            minutes = `${(minutes % 60)} minute${minutes === 1 ? "" : "s"} `;
        } else if (minutes > 0) {
            minutes = `${minutes} minute${minutes === 1 ? "" : "s"} `;
        }

        if (hours > 24) {
            days = Math.floor(hours / 24);
            hours = `${(hours % 24)} hour${hours === 1 ? "" : "s"} `;
        } else if (hours > 0) {
            hours = `${hours} hour${hours === 1 ? "" : "s"} `;
        }

        if (days > 0) {
            retval = `${days} day${days === 1 ? "" : "s"} `;
        }
        if (hours) {
            retval = retval + hours;
        }
        if (minutes) {
            retval = retval + minutes;
        }
        if (seconds) {
            retval = retval + seconds;
        }

        return retval;
    } else {
        return ""
    }
}

function getEstimatedTimeRemaining(report, type) {
    let createTime = null;
    let summaryKey = null;
    if (type === 'build') {
        createTime = report.hasOwnProperty('testruns') && report.testruns !== null ? report.testruns[0].dateCreated : null;
        summaryKey = 'groupSummary';
    } else if (type === 'testrun') {
        createTime = report.runStarted;
        summaryKey = 'summary';
    }
    if (createTime) {
        const currentTime = new Date().getTime();
        const timeSinceCreation = currentTime - createTime;
        let executedResults = 0;
        for (let key in report[summaryKey].resultsByStatus) {
            executedResults += key !== 'NO_RESULT' ? report[summaryKey].resultsByStatus[key] : 0
        }
        const executionTimePerTest = timeSinceCreation / executedResults;
        const estimatedTimeRemaining = executionTimePerTest * report[summaryKey].resultsByStatus.NO_RESULT;
        const durationString = getDurationString(estimatedTimeRemaining, true);
        return durationString !== "0 seconds" ? durationString : "";
    } else {
        return "";
    }
}
'use strict';
/**
 * User: jcorbett
 * Date: 5/30/13
 * Time: 1:27 PM
 */

// nav.group('Products').add('A Product', 'products/A+Product', 100)

angular.module('slickApp')
  .provider('NavigationService', function() {
      var _show = false;
      var _mode = "overlay";
      var _title = "Slick";
      var _nav = [
          {name: "Bookmarks",
           show: false,
           icon: "bookmarks.png",
           links: [
           ]},
          {name: "Reports",
           show: false,
           icon: "reports.png",
           links: [
          ]},
          {name: "Run Tests",
           show: false,
           icon: "runtests.png",
           links: [
          ]},
          {name: "Settings",
           show: false,
           icon: "settings.png",
           links: [
           ]},
          {name: "Project Management",
           show: false,
           icon: "project.png",
           links: [
          ]},
          {name: "Test Management",
           show: false,
           icon: "testmgmt.png",
           links: [
          ]},
          {name: "Dashboards",
           show: false,
           icon: "dashboards.png",
           links: [
           ]}
      ];

      var getSection = function(name) {
          return _.findWhere(_nav, { name: name });
      };
      this.getSection = getSection;

      var addSection = function(name, showByDefault, iconUrl) {
          if(!iconUrl) {
              iconUrl = "iconUrl/section-" + name + ".png"
          } else if( iconUrl === this.NOICON) {
              iconUrl = null;
          }

          if(showByDefault === undefined) {
              showByDefault = false;
          }
          var lenofarray = _nav.push({name: name, show: showByDefault, icon: iconUrl, links: []});
          return _nav[lenofarray - 1];
      };
      this.addSection = addSection;

      var addLink = function(section, name, url) {
          var sect = this.getSection(section);
          if(!sect) {
              sect = this.addSection(section);
          }
          var lenofarray = sect.links.push({name: name, url: url})
          return sect.links[lenofarray - 1];
      };
      this.addLink = addLink;

      this.$get = ['$cookieStore', '$window', function(cookieStore, $window) {
        if(getSection('Bookmarks').links.length > 0) {
            getSection('Bookmarks').show = true;
        }
        var nav = {
            NOICON: "NO ICON",

            show: function() {
                return Boolean(cookieStore.get('nav-show'));
            },

            mode: function() {
                if(cookieStore.get('nav-mode') == "pinned") {
                    return "pinned";
                } else {
                    return "overlay";
                }
            },

            toggleShow: function() {
                if(this.show() && this.mode() != "pinned") {
                    cookieStore.put('nav-show', false);
                } else {
                    cookieStore.put('nav-show', true);
                }
            },

            toggleMode: function() {
                if(this.mode() == "overlay") {
                    cookieStore.put("nav-mode", 'pinned');
                } else {
                    cookieStore.put("nav-mode", 'overlay');
                }
            },

            sections: function() {
                return _nav;
            },

            getSection: getSection,
            addSection: addSection,
            addLink: addLink,
            getTitle: function() {
                return _title;
            },
            setTitle: function(title) {
                _title = title;
                $window.document.title = title;
            }
        };
        return nav;
      }];
    });/**
 * User: jcorbett
 * Date: 6/28/13
 * Time: 12:28 AM
 */
"use strict";

angular.module('slickApp')
    .factory('NameBasedRestangular', ['Restangular', function(Restangular) {
        return Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('api/');
            RestangularConfigurer.setRestangularFields({
                id: 'name'
            });
        });
    }]);

/**
 * User: jcorbett
 * Date: 7/31/13
 * Time: 3:03 PM
 */

"use strict";

angular.module('slickApp')
    .service('UserService', [ 'Restangular', function(rest) {
        var userservice = {
            currentUser: {},
            getCurrentUser: function() {
                var emptyUser = function() {
                    _.each(userservice.currentUser, function(value, key) {
                        delete userservice.currentUser[key];
                    });
                };
                rest.one('users', 'current').get().then(function(user) {
                    emptyUser();
                    _.each(user, function(value, key) {
                        userservice.currentUser[key] = value;
                    });
                }, function() {
                    emptyUser();
                });
            },
            refresh: function() {
                userservice.getCurrentUser();
            },
            setPreference: function(key, value) {

            }
        };
        return userservice;
    }]);
/**
 * User: jcorbett
 * Date: 7/22/13
 * Time: 4:01 PM
 */

angular.module("slickApp")
    .directive("slickListHeader", function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: "static/resources/shared/slick-list/slick-list-header.html",
            scope: {
                model: "=",
                search: "@",
                pagination: "@",
                defaultSort: "@",
                sort: "@"
            },
            controller: function($scope) {
                $scope.paginationOn = $scope.pagination == 'on' || $scope.pagination == 'yes' || $scope.pagination == 'true';

                if($scope.paginationOn) {
                    $scope.model.pagenum = 1;
                    $scope.model.pageSize = 10;
                    $scope.nextPage = function() {
                        if($scope.model.pagenum < $scope.model.totalpages) {
                            $scope.model.pagenum++;
                        }
                    }
                    $scope.prevPage = function() {
                        if($scope.model.pagenum > 1) {
                            $scope.model.pagenum--;
                        }
                    }
                }

                if(!$scope.model.orderBy && $scope.defaultSort) {
                    $scope.model.orderBy = $scope.defaultSort;
                }
                if(!_.has($scope.model, "reverseOrder")) {
                    $scope.model.reverseOrder = false;
                }
                this.orderBy = function(propertyName) {
                    if($scope.model.orderBy == propertyName) {
                        $scope.model.reverseOrder = !$scope.model.reverseOrder;
                    } else {
                        $scope.model.orderBy = propertyName;
                        $scope.model.reverseOrder = false;
                    }
                };

                this.getOrderBy = function() {
                    if($scope.sort == 'off' || $scope.sort == 'no' || $scope.sort == 'false') {
                        return null;
                    }
                    return $scope.model.orderBy;
                };

                this.sortReversed = function() {
                    return $scope.model.reverseOrder;
                };
            },
            link: function(scope, element, attrs) {
                if(attrs.defaultPageSize) {
                    scope.model.pageSize = Number(attrs.defaultPageSize);
                }

                if(attrs.defaultSortReverse && (attrs.defaultSortReverse == "true" || attrs.defaultSortReverse == "on" || attrs.defaultSortReverse == "yes")) {
                    scope.model.reverseOrder = true;
                }
            }
        }
    })
    .directive("slickListColumns", function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            require: "^slickListHeader",
            template: "<div class=\"slick-list-columns\" ng-transclude></div>",
            scope: {},
            controller: function($scope) {
            //controller: function($scope) {
                this.orderBy = function(propertyName) {
                    $scope.orderBy(propertyName);
                };

                this.getOrderBy = function() {
                    return $scope.getOrderBy();
                };

                this.sortReversed = function() {
                    return $scope.sortReversed();
                };
            },
            link: function(scope, element, attrs, slickListHeaderController) {
                scope.orderBy = function(propertyName) {
                    slickListHeaderController.orderBy(propertyName);
                };

                scope.getOrderBy = function() {
                    return slickListHeaderController.getOrderBy();
                };

                scope.sortReversed = function() {
                    return slickListHeaderController.sortReversed();
                };
            }
        }
    })
    .directive("slickListColumn", function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            require: "^slickListColumns",
            scope: {
               sortable: "@",
               sortPropertyName: "@"
            },
            template: "<div class=\"slick-list-column\" ng-click=\"setOrderBy()\"><span ng-transclude></span><img class=\"slick-list-column-sort-image\" src=\"static/images/sort-down.png\" ng-show=\"currentlySorted() && !sortReversed()\" /><img class=\"slick-list-column-sort-image\" src=\"static/images/sort-up.png\" ng-show=\"currentlySorted() && sortReversed()\" /></div>",
            link: function(scope, element, attrs, slickListColumnsController) {
                var sortable = scope.sortable == "yes" || scope.sortable == "on" || scope.sortable == "true";
                if(sortable) {
                    element.addClass("slick-list-sortable-column");
                }
                scope.currentlySorted = function() {
                    if(!sortable) {
                        return false;
                    }
                    return slickListColumnsController.getOrderBy() == scope.sortPropertyName;
                };

                scope.sortReversed = function() {
                    return slickListColumnsController.sortReversed();
                };

                scope.setOrderBy = function() {
                    if(sortable) {
                        slickListColumnsController.orderBy(scope.sortPropertyName);
                    }
                };
            }
        }
    })
    .filter('slickListFilter', ['filterFilter', 'orderByFilter', function(filter, orderBy) {
        return function(array, model) {
            if(!_.isArray(array)) { return array; }
            var orderedArray = filter(array, model.searchField);
            if(model.orderBy) {
                orderedArray = orderBy(orderedArray, model.orderBy, model.reverseOrder);
            }

            var finalArray = orderedArray;
            if(_.has(model, 'pageSize')) {
                model.totalpages = Math.ceil(orderedArray.length / model.pageSize);
                if(model.pagenum > 1 && model.pagenum > model.totalpages) {
                    model.pagenum = model.totalpages;
                }
                finalArray = orderedArray.slice((model.pagenum - 1) * model.pageSize, ((model.pagenum) * model.pageSize));
            }

            return finalArray;
        }
    }]);


/**
 * User: jcorbett
 * Date: 8/5/13
 * Time: 10:37 AM
 */

angular.module('slickApp').
    directive('contenteditable', function() {
        return {
            restrict: 'A', // only activate on element attribute
            require: '?ngModel', // get a hold of NgModelController
            link: function(scope, element, attrs, ngModel) {
                if(!ngModel) return; // do nothing if no ng-model

                // Specify how UI should be updated
                ngModel.$render = function() {
                    element.html(ngModel.$viewValue || '');
                };

                // Listen for change events to enable binding
                element.bind('blur keyup change', function() {
                    scope.$apply(read);
                });
                //read(); // initialize

                // Write data to the model
                function read() {
                    var html = element.html();
                    // When we clear the content editable the browser leaves a <br> behind
                    // If strip-br attribute is provided then we strip this out
                    if( attrs.stripBr && html == '<br>' ) {
                        html = '';
                    }
                    ngModel.$setViewValue(html);
                }
            }
        };
    });
/**
 * User: jcorbett
 * Date: 8/8/13
 * Time: 3:53 PM
 */

angular.module("slickApp")
    .directive("slickDialog", function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: "static/resources/shared/slick-dialog/slick-dialog.html",
            scope: {
                show: "=",
                title: "@",
                size: "@",
                buttons: "@",
                buttonCallback: "&"
            },

            link: function(scope, element, attrs) {
                scope.buttonNames = scope.buttons.split("|");
            }

        }
    });
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
/**
 * User: jcorbett
 * Date: 9/30/13
 * Time: 9:54 AM
 */


angular.module("slickApp")
    .directive("slickTagList", function() {
        return {
            restrict: 'E',
            require: ['^?form'],
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/slick-tag-list/slick-tag-list.html",
            scope: {
                model: "="
            },

            link: function(scope, element, attrs, ctrls) {
                var i = 0;
                if(attrs.editable && (attrs.editable.toLowerCase() == "false" || attrs.editable.toLowerCase() == "no")) {
                    scope.editable = false;
                } else {
                    scope.editable = true;
                }
                var form = ctrls[0];

                scope.removeTag = function(tagName) {
                    var index = _.indexOf(scope.model, tagName);
                    if(index >= 0) {
                        scope.model.splice(index, 1);
                        if(form) {
                            form.$setDirty();
                        }
                    }
                };

                scope.addTag = function() {
                    if( ++i > 1) {
                        scope.model.unshift("new tag " + i);
                    } else {
                        scope.model.unshift("new tag");
                    }
                    if(form) {
                        form.$setDirty();
                    }
                };
            }

        };
    });
'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService', 'UserService', '$http', function ($scope, nav, user, $http) {
        $scope.title = 'Slick';

        $scope.showLogin = false;

        user.refresh();
        $scope.user = user.currentUser;

        $scope.getAccountName = function() {
            if ($scope.user.short_name) {
                return $scope.user.short_name;
            }
            if ($scope.user.full_name) {
                return $scope.user.full_name;
            }
            return $scope.user.email;
        };

        $scope.logout = function($event) {
            $event.preventDefault();
            $http({method: 'GET', url: 'logout'}).success(function() {
                user.refresh();
            })
        };

        $scope.getTitle = function() {
            return nav.getTitle();
        };

        $scope.showNav = function($event) {
            nav.toggleShow();
            if($event) {
                $event.preventDefault();
            }
        };

        $scope.$on('$routeChangeSuccess', function() {
            if(nav.show()) {
                nav.toggleShow();
            }
            nav.setTitle("Slick");
        });

    }]);

'use strict';

angular.module('slickApp')
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'static/resources/shared/main/main.html',
        controller: 'MainCtrl'
      });
  }])
  .controller('MainCtrl', ['$scope', 'Restangular', '$interval', '$routeParams', function ($scope, rest, $interval, $routeParams) {
        $scope.testrunTableOne = {};
        $scope.testrunTableTwo = {};
        $scope.testrunListOne = [];
        $scope.testrunListTwo = [];

        $scope.testrungroupTableOne = {};
        $scope.testrungroupTableTwo = {};
        $scope.testrungroupListOne = [];
        $scope.testrungroupListTwo = [];

        $scope.buildTableOne = {};
        $scope.buildTableTwo = {};
        $scope.buildListOne = [];
        $scope.buildListTwo = [];
        $scope.project = "";
        if($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }

        var stop;

        $scope.fetchData = function() {
            var testrunsQuery = {orderby: '-dateCreated', limit: 10};
            if($scope.project !== "") {
                testrunsQuery["project.name"] = $scope.project;
            }
            rest.all('testruns').getList(testrunsQuery).then(function(testruns) {
                $scope.testrunListOne = testruns.splice(0, 5);
                $scope.testrunListTwo = testruns;
            });
            rest.all('testrungroups').getList({orderby: '-created', limit: 10}).then(function(testrungroups) {
                $scope.testrungroupListOne = testrungroups.splice(0,5);
                $scope.testrungroupListTwo = testrungroups;
            });

            // recent builds are a little tricky
            var buildList = [];

            function processBuildList(buildList) {
                buildList = _.sortBy(buildList, function(build) {
                    if(build.build.built) {
                        return build.build.built;
                    } else {
                        return 0;
                    }
                });
                buildList.reverse();


                _.each(buildList.slice(0, 10), function(buildInfo, index) {
                    rest.one('build-report', buildInfo.project.name).one(buildInfo.release.name, buildInfo.build.name).get().then(function(buildReport) {
                        buildInfo.report = buildReport;
                        if (index < 5) {
                            $scope.buildListOne[index] = buildInfo;
                        } else {
                            $scope.buildListTwo[index - 5] = buildInfo;
                        }
                    });
                });
            }
            if($scope.project === "") {
                rest.all('projects').getList().then(function (projects) {
                    _.each(projects, function (project) {
                        _.each(project.releases, function (release) {
                            _.each(release.builds, function (build) {
                                // This creates a flat list that we can sort
                                buildList.push({build: build, project: project, release: release});
                            });
                        });
                    });
                    processBuildList(buildList);
                });
            } else {
                rest.one('projects', $scope.project).get().then(function(project) {
                    _.each(project.releases, function (release) {
                        _.each(release.builds, function (build) {
                            // This creates a flat list that we can sort
                            buildList.push({build: build, project: project, release: release});
                        });
                    });
                    processBuildList(buildList);
                });
            }
        };

        $scope.stopRefresh = function() {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
        };

        $scope.$on('$destroy', function() {
            $scope.stopRefresh();
        });

        $scope.fetchData();
        stop = $interval($scope.fetchData, 7500);
        window.scope = $scope;
  }]);
'use strict';
/**
 * User: jcorbett
 * Date: 5/31/13
 * Time: 2:00 PM
 */

angular.module('slickApp')
    .controller('NavCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        $scope.nav = nav;
        $scope.slickHomeUrl = document.baseURI;

        $scope.toggleShow = function(group, $event) {
            group.show = !group.show;
            $event.preventDefault();
        };

        $scope.toggleMode = function($event) {
            nav.toggleMode();
            $event.preventDefault();
        };

    }]);
/**
 * User: jcorbett
 * Date: 6/26/13
 * Time: 9:15 AM
 */
"use strict";


angular.module('slickApp')
    .controller('ParentCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        $scope.nav = nav;
    }]);
/**
 * User: jcorbett
 * Date: 7/31/13
 * Time: 2:06 PM
 */


angular.module('slickLoginApp')
    .controller('loginCtrl', ['$scope', function ($scope) {
        $scope.postForm = function($event) {
            //TODO: Figure out a better way to do this
            $event.target.parentElement.submit()
        }
    }]);
'use strict';
/**
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:06 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({
            templateUrl: 'static/resources/pages/not-found/not-found.html',
            controller: 'NotFoundCtrl'
        });
    }])
    .controller('NotFoundCtrl', ['$scope', function ($scope) {
        // nothing to do right now
    }]);
/**
 * User: jcorbett
 * Date: 6/27/13
 * Time: 2:59 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/projects', {
                templateUrl: 'static/resources/pages/project/projects.html',
                controller: 'ProjectsCtrl'
            })
            .when('/projects/:name', {
                templateUrl: 'static/resources/pages/project/view-project.html',
                controller: 'ViewAndUpdateProjectCtrl'
            });
        nav.addLink('Project Management', 'Add Project', 'projects?add=true');
        nav.addLink('Project Management', 'Projects', 'projects');
    }])
    .controller('ProjectsCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.project = {
            name: "",
            description: ""
        };


        $scope.showAddProject = false;
        if($routeParams.add) {
            $scope.showAddProject = true;
        }
        $scope.addProject = function() {
            $scope.showAddProject = !$scope.showAddProject;
        };

        $scope.addProjectDialogButtonClicked = function(buttonName) {
            if(buttonName != 'Cancel') {
                rest.all('projects').post($scope.project).then(function() {
                    $scope.project.name = "";
                    $scope.project.description = "";
                    rest.all('projects').getList().then(function(projects) {
                        $scope.projects = projects;
                    });
                });
            }
            $scope.addProject();
        };

        rest.all('projects').getList().then(function(projects) {
            $scope.projects = projects;
            nav.setTitle("Slick Projects");
        });
        $scope.projectList = {}; // Model for the list header and filter
    }])
    .controller('ViewAndUpdateProjectCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$routeParams', '$cookieStore', function($scope, rest, nav, $routeParams, $cookieStore) {
        $scope.releaseList = {};
        $scope.buildLists = {};

        $scope.showAddComponent = false;
        $scope.component = {
            name: "",
            code: ""
        };

        $scope.showAddRelease = false;
        $scope.newRelease = {
            name: '',
            target: (new Date()).valueOf()
        };

        $scope.showAddBuild = false;
        $scope.newBuild = {
            name: '',
            built: (new Date()).valueOf()
        };

        $scope.addComponent = function() {
            $scope.showAddComponent = !$scope.showAddComponent;
        };

        $scope.$watch('component.name', function() {
            $scope.component.code = $scope.component.name.toLowerCase().replace(/ /g, "-");
        });

        $scope.toggleAddRelease = function() {
            $scope.showAddRelease = ! $scope.showAddRelease;
        };

        $scope.toggleAddBuild = function() {
            $scope.showAddBuild = ! $scope.showAddBuild;
        }

        $scope.dialogButtonClicked = function(buttonName) {
            if(buttonName == "Add") {
                if(! $scope.project.components) {
                    $scope.project.components = [];
                }
                $scope.project.components.push({ name: String($scope.component.name), code: String($scope.component.code), id: (new ObjectId()).toString()});
                $scope.projectForm.$setDirty();
            } else {
                //Cancel button was clicked
            }
            $scope.component.name = "";
            $scope.component.code = "";
            $scope.addComponent();
        };

        $scope.addReleaseDialogButtonClicked = function(buttonName) {
            if(buttonName == 'Add') {
                $scope.project.releases.push({id: (new ObjectId()).toString(),
                    name: $scope.newRelease.name,
                    target: $scope.newRelease.target,
                    status: 'active'});
                $scope.projectForm.$setDirty();
                $scope.newRelease.name = '';
                $scope.newRelease.target = (new Date()).valueOf();
            }
            $scope.toggleAddRelease();
        };

        $scope.addBuildDialogButtonClicked = function(buttonName) {
            if(buttonName == 'Add') {
                var selRelease = {};
                _.each($scope.project.releases, function(release) {
                    if(release.id == $scope.selectedRelease) {
                        selRelease = release;
                    }
                });
                selRelease.builds.push({id: (new ObjectId()).toString(),
                                        name: $scope.newBuild.name,
                                        built: $scope.newBuild.built});
                $scope.projectForm.$setDirty();
                $scope.newBuild.name = '';
                $scope.newBuild.built = (new Date()).valueOf();
            }
            $scope.toggleAddBuild();
        };

        rest.one('projects', $routeParams.name).get().then(function(project) {
            $cookieStore.put('slick-last-project-used', project.name);
            $scope.project = project;
            window.project = project;
            nav.setTitle($scope.project.name);
            if(project.releases && project.releases.length > 0) {
                $scope.selectedRelease = project.releases[0].id;
            }
            $scope.buildLists = {};
            _.each(project.releases, function(release) {
                $scope.buildLists[release.id] = {};
            });
        });

        $scope.isSelectedRelease = function(releaseId) {
            if(releaseId == $scope.selectedRelease) {
                return "project-release-selected";
            } else {
                return "";
            }
        };

        $scope.selectRelease = function(releaseId) {
            $scope.selectedRelease = releaseId;
        };

        $scope.save = function() {
            $scope.project.put().then(function(project) {
                $scope.project = project;
                $scope.projectForm.$setPristine();
            });
        };

        $scope.revert = function() {
            $scope.project.get().then(function(project) {
                $scope.project = project;
                $scope.projectForm.$setPristine();
            });
        };

        $scope.setDefaultRelease = function(releaseid) {
            $scope.project.defaultRelease = releaseid;
            $scope.projectForm.$setDirty();
        };

        $scope.changeReleaseStatus = function(release) {
            if(release.status == 'active') {
                release.status = 'inactive';
            } else {
                release.status = 'active';
            }
            $scope.projectForm.$setDirty();
        };
    }]);
/**
 * User: jcorbett
 * Date: 9/27/13
 * Time: 2:05 PM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/find-testcases', {
                templateUrl: 'static/resources/pages/find-testcases/find-testcases.html',
                controller: 'FindTestcasesCtrl'
            })
            .when('/testcases', {
                templateUrl: 'static/resources/pages/find-testcases/testcase-tree.html',
                controller: 'TestcaseTreeCtrl'
            });
        nav.addLink('Test Management', 'Query for Testcases', 'find-testcases');
        nav.addLink('Test Management', 'Browse Testcases', 'testcases');
    }])
    .controller('FindTestcasesCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', '$location', function ($scope, projrest, rest, nav, $routeParams, $location) {
        nav.setTitle("Query For Testcases");
        // --------------------  required variables initialization ----------------------
        $scope.testcaseList = {};

        $scope.queryResult = [];

        $scope.mode = "form";

        $scope.query = "";

        $scope.queryForm = {
            project: "",
            name: "",
            component: "",
            tags: "",
            purpose: ""
        };

        $scope.project = {};
        $scope.component = {};

        // -------------------- read from query parameters ----------------------
        if($routeParams.mode == "form") {
            if($routeParams.project) {
                $scope.queryForm.project = $routeParams.project;
            }
            if($routeParams.name) {
                $scope.queryForm.name = $routeParams.name;
            }
            if($routeParams.component) {
                $scope.queryForm.component = $routeParams.component;
            }
            if($routeParams.tags) {
                $scope.queryForm.tags = $routeParams.tags;
            }
            if($routeParams.purpose) {
                $scope.queryForm.purpose = $routeParams.purpose;
            }
        } else if($routeParams.mode == "query") {
            $scope.mode = "query";
            $scope.query = $routeParams.query;
        }

        window.scope = $scope;

        // -------------------- prepare the form ----------------------
        $scope.projects = [];

        projrest.all('projects').getList().then(function(projects) {
            $scope.projects = projects;
            if($scope.queryForm.project) {
                _.each($scope.projects, function(project) {
                    if(project.id == $scope.queryForm.project) {
                        $scope.project = project;
                        if ($scope.queryForm.component) {
                            _.each($scope.project.components, function(component) {
                                if(component.id == $scope.queryForm.component) {
                                    $scope.component = component;
                                }
                            });
                        }
                    }
                });
            }
        });

        // -------------------- scope methods ----------------------

        $scope.generateQuery = function() {
            var parts = [];
            if ($scope.queryForm.project) {
                parts.push("eq(project.id,\"" + $scope.queryForm.project + "\")");
            }
            if ($scope.queryForm.component) {
                parts.push("eq(component.id,\"" + $scope.queryForm.component + "\")");
            }
            if ($scope.queryForm.name) {
                parts.push("icontains(name,\"" + $scope.queryForm.name + "\")");
            }
            if ($scope.queryForm.tags) {
                var taglist = [];
                _.each($scope.queryForm.tags.split(","), function(tag) {
                    taglist.push(tag.trim())
                });
                parts.push("in(tags,(\"" + taglist.join("\",\"") + "\"))");
            }
            if ($scope.queryForm.purpose) {
                parts.push("icontains(purpose,\"" + $scope.queryForm.purpose + "\")");
            }
            if(parts.length == 1) {
                $scope.query = parts[0];
            } else if(parts.length > 1) {
                $scope.query = "and(" + parts.join(",") + ")"
            }
        };

        $scope.generateQuery();

        if($scope.query) {
            rest.all('testcases').getList({q: $scope.query}).then(function(testcases) {
                $scope.queryResult = testcases;
            });
        }

        $scope.executeQuery = function() {
            if($scope.mode == "form") {
                $location.search('mode', $scope.mode);
                _.each(["project", "component", "name", "tags", "purpose"], function(part) {
                    if($scope.queryForm[part]) {
                        $location.search(part, $scope.queryForm[part]);
                    } else {
                        $location.search(part, null);
                    }
                });
            } else {
                $location.search('mode', $scope.mode);
                // wipe out current search parameters
                _.each(["project", "component", "name", "tags", "purpose"], function(part) {
                    $location.search(part, null);
                });
                $location.search('query', $scope.query);
            }
        };

        // ------------------- watches ------------------------
        $scope.$watch('project', function() {
            if($scope.project.id) {
                $scope.queryForm.project = $scope.project.id;
            }
            $scope.generateQuery();
        });

        $scope.$watch('component', function() {
            if($scope.component.id) {
                $scope.queryForm.component = $scope.component.id;
            }
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.name', function() {
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.tags', function() {
            $scope.generateQuery();
        });

        $scope.$watch('queryForm.purpose', function() {
            $scope.generateQuery();
        });


    }])
    .controller('TestcaseTreeCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', '$location', '$cookieStore', function ($scope, projrest, rest, nav, $routeParams, $location, $cookieStore) {
        // --------------- Initialize Variables used in the Page -------------------
        $scope.projects = [];
        $scope.project = null;
        $scope.selectedProjectName = null;
        $scope.testTree = [];
        $scope.testcaseList = {};
        window.testTree = $scope.testTree;


        // determine if we have a pre-selected project
        if ($routeParams['project']) {
            $scope.selectedProjectName = $routeParams['project'];
            $cookieStore.put('slick-last-project-used', $routeParams['project']);
        } else if ($cookieStore.get('slick-last-project-used')) {
            $scope.selectedProjectName =  $cookieStore.get('slick-last-project-used');
        }

        // Get the list of projects, sorted by last updated
        projrest.all('projects').getList({orderby: '-lastUpdated'}).then(function(projects) {
            $scope.projects = projects;
            if ($scope.selectedProjectName) {
                $scope.project = _.find($scope.projects, function(project) { return project.name == $scope.selectedProjectName; });
            } else {
                // auto-select the most recently updated project
                $scope.project = $scope.projects[0];
            }
            _.each($scope.project.components, function(component) {
                $scope.testcaseList[component.id] = {};
                var copy = _.cloneDeep(component);
                $scope.testTree.push(copy);
                rest.all('testcases').getList({q: 'and(eq(project.id,"' + $scope.project.id + '"),eq(component.id,"' + copy.id + '"),not(exists(feature,true)))'}).then(function(testcases) {
                    copy.testcases = testcases;
                });
                _.each(copy.features, function(feature) {
                    $scope.testcaseList[feature.id] = {};
                    rest.all('testcases').getList({q: 'and(eq(project.id,"' + $scope.project.id + '"),eq(component.id,"' + copy.id + '"),eq(feature.id,"' + feature.id + '"))'}).then(function(testcases) {
                        feature.testcases = testcases;
                    });
                });
            })
        });


        // --------------- Response Functions ------------------

        $scope.selectProject = function(project) {
            $location.search({project: project.name});
        };

        window.scope = $scope;

    }]);

/**
 * User: slambson
 * Date: 10/29/13
 * Time: 2:59 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testcases/:name', {
                templateUrl: 'static/resources/pages/testcase/view-testcase.html',
                controller: 'ViewAndUpdateTestcaseCtrl'
            });
    }])
    .controller('ViewAndUpdateTestcaseCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.testcaseEditable = true;

        $scope.stepsList = {};

        $scope.showAddStep = false;
        $scope.step = {
            name: "",
            expectedResult: ""
        };

        $scope.toggleAddStep = function() {
            $scope.showAddStep = !$scope.showAddStep;
        };

        $scope.addStepDialogButtonClicked = function(buttonName) {
            if(buttonName == "Add") {
                if(! $scope.testcase.steps) {
                    $scope.testcase.steps = [];
                }
                $scope.testcase.steps.push({ name: String($scope.step.name), expectedResult: String($scope.step.expectedResult), id: (new ObjectId()).toString()});
                $scope.testcaseForm.$setDirty();
            } else {
                //Cancel button was clicked
            }
            $scope.step.name = "";
            $scope.step.expectedResult = "";
            $scope.toggleAddStep();
        };

        rest.one('testcases', $routeParams.name).get().then(function(testcase) {
            $scope.testcase = testcase;
            window.testcase = testcase;
            nav.setTitle($scope.testcase.name);
            $scope.stepsList = {};
            _.each(testcase.steps, function(step) {
                $scope.stepsList[step.name] = {};
            });
        });

        $scope.save = function() {
            $scope.testcase.put().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.testcaseForm.$setPristine();
            });
        };

        $scope.revert = function() {
            $scope.testcase.get().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.testcaseForm.$setPristine();
            });
        };
    }
]);
/**
 * User: jcorbett
 * Date: 11/23/13
 * Time: 9:15 PM
 */


angular.module("slickApp")
    .directive("slickTestrunStatusbar", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrun-statusbar/statusbar.html",
            scope: {
                summary: "=",
                size: "@"
            },

            link: function(scope, element, attrs, ctrls) {
                if (scope.size != "large" && scope.size != "normal") {
                    scope.size = "normal";
                }
                scope.setStats = function () {
                    scope.stats = [];

                    _.each(scope.summary.statusListOrdered, function(statusName) {
                        scope.stats.push({name: statusName,
                            width: ((scope.summary.resultsByStatus[statusName] / scope.summary.total) * 100).toFixed(0)});
                    });
                };
                scope.setStats();
                scope.$watch('summary', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.setStats();
                    }
                });
            }

        };
    });
/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testruns', {
                templateUrl: 'static/resources/pages/testruns/testrun-list.html',
                controller: 'TestrunListCtrl'
            })
            .when('/testruns/:testrunid', {
                templateUrl: 'static/resources/pages/testruns/testrun-summary.html',
                controller: 'TestrunSummaryCtrl'
            });
        nav.addLink('Reports', 'Testruns', 'testruns');
    }])
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookieStore', '$location', 'UserService', function ($scope, rest, nav, $routeParams, $cookieStore, $location, user) {
        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];

        $scope.user = user.currentUser;
        $scope.editOn = false;


        if (!$routeParams["project"] && $cookieStore.get('slick-last-project-used')) {
            $location.search("project", $cookieStore.get('slick-last-project-used'));
        }
        $scope.$watch('project', function (newValue, oldValue) {
            if (newValue && oldValue != newValue) {
                $location.search("project", newValue.name);
                $location.search("release", null);
                $location.search("testplanId", null);
            }
        });

        nav.setTitle("Testruns");
        rest.all('projects').getList().then(function(projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($routeParams["project"]) {
                $scope.project = _.find(projects, function(project) {
                    return $routeParams["project"] == project.name;
                });
                if ($scope.project) {
                    $scope.releases = $scope.project.releases;
                    if ($routeParams["release"]) {
                        $scope.release = _.find($scope.releases, function(release) {
                            return $routeParams["release"] == release.name;
                        });
                    }
                    $scope.$watch('release', function (newValue, oldValue) {
                        if(newValue) {
                            $location.search('release', newValue.name);
                        }
                    });
                    rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function(testplans) {
                        $scope.testplans = testplans;
                        if ($routeParams["testplanid"]) {
                            $scope.testplan = _.find($scope.testplans, function(testplan) {
                                return $routeParams["testplanid"] == testplan.id;
                            });
                        }
                        $scope.$watch('testplan', function(newValue, oldValue) {
                            if (newValue) {
                                $location.search("testplanid", newValue.id);
                            }
                        });
                    });
                }

            }
        });

        $scope.fetchTestruns = function(full) {
            var testrunQuery = [];
            if ($routeParams["project"]) {
                testrunQuery.push("eq(project.name,\"" + $routeParams["project"] + "\")");
            }
            if ($routeParams["release"]) {
                testrunQuery.push("eq(release.name,\"" + $routeParams["release"] + "\")");
            }
            if ($routeParams["testplanid"]) {
                testrunQuery.push("eq(testplanId,\"" + $routeParams["testplanid"] + "\")");
            }

            var q = "";
            if (testrunQuery.length > 1) {
                q = "and(";
            }
            q = q + testrunQuery.join();
            if (testrunQuery.length > 1) {
                q = q + ")";
            }
            if (q == "") {
                if(full) {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 525}).then(function(testruns) {
                        $scope.testruns = testruns;
                    });
                } else {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 25}).then(function(testruns) {
                        $scope.testruns = testruns;
                        rest.all('testruns').getList({orderby: '-dateCreated', limit: 500, skip: 25}).then(function(therest) {
                            _.each(therest, function(testrun) { $scope.testruns.push(testrun)});
                        });
                    });
                }
            } else {
                if(full) {
                    rest.all('testruns').getList({q: q, limit: 525, orderby: '-dateCreated'}).then(function (testruns) {
                        $scope.testruns = testruns;
                    });
                } else {
                    rest.all('testruns').getList({q: q, limit: 25, orderby: '-dateCreated'}).then(function (testruns) {
                        $scope.testruns = testruns;
                        rest.all('testruns').getList({q: q, orderby: '-dateCreated', limit: 500, skip: 25}).then(function (therest) {
                            _.each(therest, function (testrun) {
                                $scope.testruns.push(testrun)
                            });
                        });
                    });
                }
            }
        };
        $scope.fetchTestruns(false);

        $scope.testrunList = {}; // Model for the list header and filter

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.isEmpty = function(obj) {
            return _.isEmpty(obj);
        };

        $scope.toggleEdit = function() {
            $scope.editOn = !$scope.editOn;
        };

        $scope.deleteTestrun = function(testrun) {
            rest.one('testruns', testrun.id).remove().then(function() {
                $scope.fetchTestruns(true);
            })
        };

        window.scope = $scope;

    }])
    .controller('TestrunSummaryCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', '$cookieStore', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location, $cookieStore) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrun = {};
        $scope.results = [];
        $scope.filter = {};
        $scope.resultQuery = {};
        $scope.resultList = {};
        $scope.moreDetailForResult = {};
        $scope.moreDetail = false;
        $scope.data = new google.visualization.DataTable();
        $scope.data.addColumn('string', 'Status');
        $scope.data.addColumn('number', 'Results');
        $scope.showAddNote = false;
        $scope.note = {
            result: null,
            message: '',
            externalLink: '',
            recurring: false,
            matchRelease: true,
            matchEnvironment: true
        };
        $scope.showDisplayFile = false;
        $scope.fileToDisplay = {};
        $scope.reason = "";
        $scope.showDisplayReason = false;
        $scope.logs = [];
        $scope.showDisplayLogs = false;
        $scope.recentlyFetchedTestrun = false;
        $scope.withoutNotesStats = {};
        $scope.options = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };
        if(!$cookieStore.get('testrunShowFilter')) {
            $cookieStore.put('testrunShowFilter', {
                author: true,
                component: false,
                recorded: true,
                duration: true,
                hostname: true,
                automationid: false,
                resultid: false
            });
        }
        $scope.show = $cookieStore.get('testrunShowFilter');

        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.showTestcase = false;
        $scope.showAddStep = false;

        if ($routeParams.only) {
            $scope.filter[$routeParams.only] = true;
        }

        if ($routeParams.result) {
            $scope.resultList.searchField = { $: $routeParams.result };
        }

        $scope.fetchTestrun = function() {
            rest.one('testruns', $routeParams["testrunid"]).get().then(function(testrun) {
                $scope.testrun = testrun;
                $scope.data = new google.visualization.DataTable();
                $scope.data.addColumn('string', 'Status');
                $scope.data.addColumn('number', 'Results');
                var emptyFilter = _.isEmpty($scope.filter);
                if (emptyFilter) {
                    $scope.filter = {};
                }
                $scope.options.colors = [];
                _.each(testrun.summary.statusListOrdered, function(status) {
                    $scope.data.addRow([replaceOnStatus(status, " "), testrun.summary.resultsByStatus[status]]);
                    $scope.options.colors.push(getStyle(replaceOnStatus(status, "") + "-element", "color"));
                    if (emptyFilter) {
                        $scope.filter[status] = status !== "PASS";
                        if ($routeParams.all) {
                            $scope.filter[status] = true;
                        }
                    }
                    if(status === "FAIL" || status === "BROKEN_TEST") {
                        rest.one('results', 'count').get({"q": "and(eq(testrun__testrunId,\"" +
                            $routeParams["testrunid"] + "\"),eq(status,\"" + status +
                            "\"),ne(log__loggerName,\"slick.note\"))"}).then(function(count) {
                                $scope.withoutNotesStats[status] = count;
                        });
                    }
                });

                $scope.recentlyFetchedTestrun = true;
                $scope.testrunQuery(testrun.state);
                nav.setTitle("Summary: " + $scope.getDisplayName(testrun));
                $scope.goToBuildReportButton = {
                    href: `build-report/${testrun.project.name}/${testrun.release.name}/${testrun.build.name}`,
                    name: "Build Report"
                };
                $scope.goToTPSReportButton = {
                    href: `tps-report/${testrun.project.name}/${testrun.release.name}/${testrun.testplan.name}`,
                    name: "TPS Report"
                };
                $scope.estimatedTimeRemaining = testrun.state !== 'FINISHED' ? getEstimatedTimeRemaining(testrun, 'testrun') : "";

                if(!testrun.info && testrun.project && testrun.release && testrun.build) {
                    projrest.one('projects', testrun.project.name).one('releases', testrun.release.name).one('builds', testrun.build.name).get().then(function(build) {
                        testrun.info = build.description;
                    });
                }

            });
        };

        $scope.fetchTestrun();

        $scope.testrunQuery = function(state) {
            var oldQuery = $scope.resultQuery.q;
            var includableStatuses = _.filter(_.keys($scope.filter), function(key) { return $scope.filter[key] && key !== 'withoutnotes'});
            var andQuery = ["eq(testrun__testrunId,\"" + $routeParams["testrunid"] + "\")"];
            if(includableStatuses.length === 1) {
                andQuery.push("eq(status,\"" + includableStatuses[0] + "\")")
            } else if(includableStatuses.length > 1) {
                var statuses = [];
                _.each(includableStatuses, function(status) {
                    statuses.push("eq(status,\"" + status + "\")");
                });
                andQuery.push("or(" + statuses.join(',') + ")")
            }
            if($scope.filter['withoutnotes']) {
                andQuery.push('ne(log__loggerName,"slick.note")')
            }
            $scope.resultQuery = {
                q: "and(" + andQuery.join(',') + ")"
            };
            if (oldQuery != $scope.resultQuery.q || $scope.recentlyFetchedTestrun) {
                rest.all('results').getList($scope.resultQuery).then(function(results) {
                    $scope.results = [];
                    //$scope.results = results;
                    _.each(results, function(result) {
                        if(result.started) {
                           result.recorded = result.started;
                        }
                        $scope.results.push(result);
                    });
                    $scope.recentlyFetchedTestrun = false;
                    if(state !== "FINISHED") {
                        $timeout($scope.fetchTestrun, 5000);
                    }
                });
            }
        };

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.toggleFilter = function(status) {
            $scope.filter[status] = ! $scope.filter[status];
            $scope.statusFilter.$setDirty();
        };

        $scope.getTestrunDuration = function(testrun) {
            return getDurationString(testrun.runFinished - testrun.runStarted);
        };

        $scope.getResultDuration = function(result) {
            if (result.runlength) {
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                return getDurationString(result.finished - result.started);
            }
        };

        $scope.$watch('statusFilter.$dirty', function(newValue, oldValue) {
            $scope.testrunQuery();
            $scope.statusFilter.$setPristine();
        });
        $scope.$watch('showFilter.$dirty', function(newValue, oldValue) {
            if(newValue) {
                $cookieStore.put('testrunShowFilter', $scope.show);
                $scope.showFilter.$setPristine();
            }
        });

        $scope.getAbbreviatedReason = function(result) {
            if (result.reason) {
                var line = result.reason.split("\n")[0];
                return line;
            } else {
                return "";
            }
        };

        $scope.getImages = function(result) {
            return _.filter(result.files, function(file) { return /^image/.test(file.mimetype);});
        };

        $scope.addMoreDetail = function(result) {
            $scope.moreDetailForResult[result.id] = true;
        };

        $scope.removeDetail = function(result) {
            $scope.moreDetailForResult[result.id] = false;
        };

        $scope.addNote = function(result) {
            $scope.note.result = result;
            $scope.showAddNote = true;
        };

        $scope.addNoteDialogButtonClicked = function(buttonName) {
            if (buttonName == "Add") {
                var result = $scope.note.result;
                var note = $scope.note;
                var logEntry = {
                    entryTime: new Date().getTime(),
                    level: "WARN",
                    loggerName: "slick.note",
                    message: note.message,
                    exceptionMessage: note.externalLink
                };
                rest.one('results', result.id).post('log',logEntry).then(function(numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
                if (note.recurring) {
                    rest.one('testcases', result.testcase.testcaseId).get().then(function(testcase) {
                        if (! testcase.activeNotes) {
                            testcase.activeNotes = []
                        }
                        var recurringNote = {message: note.message};
                        if (note.url) {
                            recurringNote.url = note.url;
                        }
                        if (note.matchRelease) {
                            recurringNote.release = result.release;
                        }
                        if (note.matchEnvironment) {
                            recurringNote.environment = result.config;
                        }
                        testcase.activeNotes.push(recurringNote);
                        testcase.put();
                    });
                }
            }
            $scope.showAddNote = false;
            $scope.note = {
                result: null,
                message: '',
                externalLink: '',
                recurring: false,
                matchRelease: true,
                matchEnvironment: true
            };
        };

        $scope.getResultNotes = function(result) {
            return _.filter(result.log, function(logEntry) {
                return (logEntry.level === "WARN" || logEntry.level === "INFO") && logEntry.loggerName === "slick.note";
            });
        };

        $scope.displayFile = function(file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            if(file && file.mimetype && (file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml")) {
                rest.one('files', file.id).one('content', file.filename).get().then(function(text) {
                    $scope.fileToDisplay.text = text;
                });
            }
        };

        $scope.getFileViewer = function(file) {
            if(file && file.mimetype) {
                if (file.mimetype.indexOf("image") === 0) {
                    return "image";
                } else if(file.mimetype.indexOf("video") === 0) {
                    if (file.mimetype == "video/mp4") {
                        return "html5-video";
                    } else {
                        return "embed-video";
                    }
                } else if(file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml") {
                    return "text";
                }

            }
        };

        $scope.showTestcase = function(testcaseId, $event) {
            $event.preventDefault();
            rest.one('testcases', testcaseId).get().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.showTestcaseDialog = true;
            });
        };

        $scope.getUrlForFile = function(file) {
            return "api/files/" + file.id + "/content/" + file.filename;
        };

        $scope.displayFileDialogButtonClicked = function(buttonName) {
            $scope.showDisplayFile = false;
            $scope.fileToDisplay = {};
        };

        $scope.displayReason = function(result, $event) {
            $event.preventDefault();
            $scope.showDisplayReason = true;
            $scope.reason = result.reason;
        };

        $scope.displayReasonDialogButtonClicked = function(buttonName) {
            $scope.showDisplayReason = false;
            $scope.reason = "";
        };

        $scope.displayLogs = function(result, $event) {
            $event.preventDefault();
            $scope.logs = result.log;
            $scope.showDisplayLogs = true;
        };

        $scope.displayLogsDialogButtonClicked = function(buttonName) {
            $scope.logs = [];
            $scope.showDisplayLogs = false;
        };

        $scope.displayTestcaseDialogButtonClicked = function(buttonName) {
            $scope.showTestcaseDialog = false;
            $scope.testcase = {
                name: "",
                purpose: ""
            };
        };

        $scope.onHistoryClick = function(history) {
            rest.one('results', history.resultId).get().then(function(result) {
                $location.path('testruns/' + result.testrun.testrunId);
                if (result.status == "PASS") {
                    $location.search({result: result.id, all: "true"});
                } else {
                    $location.search({result: result.id});
                }
            });
        };

        $scope.cancelResults = function () {
            rest.one('testruns', $scope.testrun.id).one('cancel').get();
        };
        
        $scope.rescheduleStatus = function(status_name) {
            rest.one('testruns', $scope.testrun.id).one('reschedule', status_name).get();
        };
        
        $scope.rescheduleResult = function(result_id) {
            rest.one('results', result_id).one('reschedule').get();
        };

        window.scope = $scope;
    }]);


/**
 * User: jcorbett
 * Date: 11/28/13
 * Time: 7:45 PM
 */

angular.module("slickApp")
    .directive("slickTestrunStats", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrun-stats/stats.html",
            scope: {
                testrun: "="
            }
        };
    });
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
                    $el.html(prettyPrintOne($el.html(), null, true));
                });
            }
        };
    });
/**
 * User: jcorbett
 * Date: 12/18/13
 * Time: 10:14 PM
 */

angular.module('slickApp')
    .directive('slickLogViewer', function() {
        return {
            restrict: 'E',
            transclude: false,
            templateUrl: 'static/resources/shared/slick-log-viewer/slick-log-viewer.html',
            replace: true,
            scope: {
                logs: "="
            },
            link: function(scope, element, attrs) {
                scope.logList = {};
            }
        };
    });
/**
 * User: Jason Corbett
 * Date: 1/15/14
 * Time: 2:39 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testrungroup/:id', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewTestrunGroupCtrl'
            })
            .when('/testrungroups/latest', {
                templateUrl: 'static/resources/pages/testrungroup/latest-testrungroups.html',
                controller: 'LatestTestrunGroupsCtrl'
            })
            .when('/testrungroups/latest/:name', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'FindLatestTestrunGroupCtrl'
            })
            .when('/testrungroup/:id/edit', {
                templateUrl: 'static/resources/pages/testrungroup/edit-testrungroup.html',
                controller: 'EditTestrunGroupCtrl'
            });
        nav.addLink('Reports', 'Testrun Groups', 'testrungroups/latest');
    }])
    .controller('ViewTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.editbutton = {
            href: "testrungroup/" + $routeParams['id'] + "/edit",
            name: "Add or Remove Testruns"
        };

        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');

        $scope.getTestrunGroupData = function() {

            $scope.summaryChartOptions = {
                chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
                backgroundColor: "#000000",
                pieSliceBorderColor: "#000000",
                legend: 'none',
                colors: []
            };

            $scope.individualChartOptions = {
                chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
                backgroundColor: "#000000",
                isStacked: true,
                legend: 'none',
                hAxis: {
                    textStyle: {
                        color: '#ffffff'
                    },
                    slantedText: true
                },
                colors: []
            };

            $scope.serialChartOptions = {
                chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                backgroundColor: "#000000",
                legend: {
                    textStyle: {
                        color: "#ffffff"
                    }
                },
                colors: []
            };

            rest.one('testrungroups', $routeParams.id).get().then(function (testrungroup) {
                $scope.testrungroup = testrungroup;
                nav.setTitle(testrungroup.name);

                if (testrungroup.grouptype == "PARALLEL") {

                    $scope.parallelSummaryData = new google.visualization.DataTable();
                    $scope.parallelSummaryData.addColumn('string', 'Status');
                    $scope.parallelSummaryData.addColumn('number', 'Results');

                    $scope.parallelIndividualData = new google.visualization.DataTable();
                    $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        $scope.parallelSummaryData.addRow([status.replace("_", " "), testrungroup.groupSummary.resultsByStatus[status]]);
                        var color = getStyle(status.replace("_", "") + "-element", "color");
                        $scope.summaryChartOptions.colors.push(color);
                        $scope.individualChartOptions.colors.push(color);

                        $scope.parallelIndividualData.addColumn('number', status.replace("_", " "))
                    });

                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [testrun.project.name + " - " + testrun.name];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.parallelIndividualData.addRow(row);
                    });
                } else {
                    $scope.serialData = new google.visualization.DataTable();
                    $scope.serialData.addColumn('date', 'Recorded');
                    _.sortBy($scope.testruns, function (testrun) {
                        return testrun.dateCreated;
                    });
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        var color = getStyle(status.replace("_", "") + "-element", "color");
                        $scope.serialChartOptions.colors.push(color);
                        $scope.serialData.addColumn('number', status.replace("_", " "))
                    });
                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [new Date(testrun.dateCreated)];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.serialData.addRow(row);
                    });
                }
                if (testrungroup.state !== "FINISHED") {
                    $scope.refreshPromise = $timeout($scope.getTestrunGroupData, 3000);
                }
            });
        };

        $scope.getTestrunGroupData();
    }])
    .controller('LatestTestrunGroupsCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testrungroups = [];
        $scope.groupList = {};

        $scope.newtr = {
            name: '',
            grouptype: 'PARALLEL'
        };
        $scope.grouptypes = ['PARALLEL', 'SERIAL'];

        $scope.getTestrunGroups = function() {
            rest.all('testrungroups').getList({orderby: "-created",limit: 200}).then(function(testrungroups) {
                $scope.testrungroups = testrungroups;
            });
        };
        $scope.getTestrunGroups();

        $scope.addTestrunGroup = function() {
            if ($scope.newtr.name != '') {
                rest.all('testrungroups').post($scope.newtr).then(function() {
                    $scope.newtr.name = '';
                    $scope.newTestrungroup.$setPristine();
                    $scope.getTestrunGroups();
                });
            }
        };

        $scope.deleteTestrunGroup = function(trgroup) {
            trgroup.remove().then(function() {
                $scope.getTestrunGroups();
            });
        };
    }])
    .controller('EditTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookieStore', function($scope, rest, nav, $routeParams, $cookieStore) {
        $scope.testrungroup = {};
        $scope.testrungroupTestrunList = {};
        $scope.availableTestrunList = {};

        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];
        $scope.testruns = [];

        rest.one('testrungroups', $routeParams.id).get().then(function(testrungroup) {
            $scope.testrungroup = testrungroup;
            nav.setTitle('Edit: ' + testrungroup.name);
        });

        rest.all('projects').getList().then(function(projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($cookieStore.get('slick-last-project-used')) {
                $scope.project = _.find(projects, function(project) {
                    return $cookieStore.get('slick-last-project-used') == project.name;
                });
            }
        });

        $scope.$watch('project', function() {
            if ($scope.project) {
                $scope.releases = $scope.project.releases;
                $scope.release = null;
                rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function(testplans) {
                    $scope.testplan = null;
                    $scope.testplans = testplans;
                });
                $scope.updateTestrunList();
            }
        });

        $scope.$watch('release', function() {
            $scope.updateTestrunList();
        });
        $scope.$watch('testplan', function() {
            $scope.updateTestrunList();
        });

        $scope.updateTestrunList = function() {
            var filter = { 'limit': 500, 'orderby': '-dateCreated' };
            if ($scope.project) {
                filter['project.id'] = $scope.project.id;
            }
            if ($scope.release) {
                filter['release.releaseId'] = $scope.release.id;
            }
            if ($scope.testplan) {
                filter['testplanId'] = $scope.testplan.id;
            }
            rest.all('testruns').getList(filter).then(function(testruns) {
                $scope.testruns = testruns;
            });
        };

        $scope.addTestrunToGroup = function(testrun) {
            rest.one('testrungroups', $scope.testrungroup.id).one('addtestrun', testrun.id).post().then(function(testrungroup) {
                $scope.testrungroup = testrungroup;
            });
        };

        $scope.removeTestrunFromGroup = function(testrun) {
            rest.one('testrungroups', $scope.testrungroup.id).one('removetestrun', testrun.id).remove().then(function(testrungroup) {
                $scope.testrungroup = testrungroup;
            });
        };

    }])
    .controller('FindLatestTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testrungroup = {};
        $scope.testrunList = {};

        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');

        $scope.summaryChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        $scope.individualChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
            backgroundColor: "#000000",
            isStacked: true,
            legend: 'none',
            hAxis: {
                textStyle: {
                    color: '#ffffff'
                },
                slantedText: true
            },
            colors: []
        };

        $scope.serialChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "#000000",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };

        rest.all('testrungroups').getList({q: "contains(name,\"" + $routeParams.name + "\")", orderby: "-created", limit: 1}).then(function(testrungroups) {
            $scope.testrungroup = testrungroups[0];
            var testrungroup = $scope.testrungroup;
            nav.setTitle(testrungroup.name);

            if(testrungroup.grouptype == "PARALLEL") {

                $scope.parallelSummaryData = new google.visualization.DataTable();
                $scope.parallelSummaryData.addColumn('string', 'Status');
                $scope.parallelSummaryData.addColumn('number', 'Results');

                $scope.parallelIndividualData = new google.visualization.DataTable();
                $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


                _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                    $scope.parallelSummaryData.addRow([replaceOnStatus(status, " "), testrungroup.groupSummary.resultsByStatus[status]]);
                    var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                    $scope.summaryChartOptions.colors.push(color);
                    $scope.individualChartOptions.colors.push(color);

                    $scope.parallelIndividualData.addColumn('number', replaceOnStatus(status, " "))
                });

                _.each(testrungroup.testruns, function(testrun) {
                    var row = [testrun.project.name + " - " + testrun.name];
                    _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                        row.push(testrun.summary.resultsByStatus[status]);
                    });
                    $scope.parallelIndividualData.addRow(row);
                });
            } else {
                $scope.serialData = new google.visualization.DataTable();
                $scope.serialData.addColumn('date', 'Recorded');
                _.sortBy($scope.testruns, function(testrun) {
                    return testrun.dateCreated;
                });
                _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                    var color = getStyle(status.replace("_", "") + "-element", "color");
                    $scope.serialChartOptions.colors.push(color);
                    $scope.serialData.addColumn('number', status.replace("_", " "))
                });
                _.each(testrungroup.testruns, function(testrun) {
                    var row = [new Date(testrun.dateCreated)];
                    _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                        row.push(testrun.summary.resultsByStatus[status]);
                    });
                    $scope.serialData.addRow(row);
                });
            }

        });

    }]);

/**
 * User: jcorbett
 * Date: 11/28/13
 * Time: 7:45 PM
 */

angular.module("slickApp")
    .directive("slickTestrunGroupStats", function() {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/testrungroup-stats/stats.html",
            scope: {
                testrungroup: "="
            }
        };
    });
/**
 * Created by jcorbett on 2/2/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/build-report/:project/:release/:build*', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            })
            .when('/build-report/:project/:release', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            });
    }])
    .controller('ViewBuildReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.editbutton = {
            href: "result-list/" + $routeParams['project'] + "/" + $routeParams['release'] + "/" + $routeParams['build'],
            name: "Broken and Failed Results"
        };


        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


        $scope.summaryChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        $scope.individualChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
            backgroundColor: "#000000",
            isStacked: true,
            legend: 'none',
            hAxis: {
                textStyle: {
                    color: '#ffffff'
                },
                slantedText: true
            },
            colors: []
        };

        var refresh_promise;

        $scope.getBuildReportData = function() {
            if ($routeParams.release === 'latest') {
                rest.one('projects', $routeParams['project']).get().then(function (project) {
                    var lastRelease = project.releases.length - 1;
                    $routeParams.release = project.releases[lastRelease]['name'];
                    var lastBuild = project.releases[lastRelease]['builds'].length - 1;
                    $routeParams.build = project.releases[lastRelease]['builds'][lastBuild]['name']
                });
            } else if ($routeParams.build === 'latest') {
                rest.one('projects', $routeParams['project']).get().then(function (project) {
                    var release = null;
                    for (var i = 0; i < project.releases.length; i++) {
                        if (project.releases[i]['name'] === $routeParams.release) {
                            release = project.releases[i];
                            break;
                        }
                    }
                    if (release !== null) {
                        var lastBuild = project.releases[i]['builds'].length - 1;
                        $routeParams.build = release['builds'][lastBuild]['name']
                    }
                });
            }
            rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).get().then(function (buildreport) {
                $scope.summaryChartOptions = {
                    chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
                    backgroundColor: "#000000",
                    pieSliceBorderColor: "#000000",
                    legend: 'none',
                    colors: []
                };

                $scope.individualChartOptions = {
                    chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
                    backgroundColor: "#000000",
                    isStacked: true,
                    legend: 'none',
                    hAxis: {
                        textStyle: {
                            color: '#ffffff'
                        },
                        slantedText: true
                    },
                    colors: []
                };
                $scope.testrungroup = buildreport;
                $scope.estimatedTimeRemaining = "";
                $scope.buildRunTime = "";
                $scope.isBuildReport = false;
                var testrungroup = buildreport;
                if (buildreport.hasOwnProperty('name')) {
                    nav.setTitle(buildreport.name);
                    let finishedRunTimes = [];
                    for (let key in buildreport.testruns) {
                        if (buildreport.testruns[key].hasOwnProperty('runFinished')) {
                            finishedRunTimes.push(buildreport.testruns[key].runFinished)
                        }
                    }
                    $scope.estimatedTimeRemaining = getEstimatedTimeRemaining(buildreport, 'build');
                    $scope.isBuildReport = true;
                    let createdTime = buildreport.testruns[0].dateCreated;
                    if (finishedRunTimes.length === buildreport.testruns.length || $scope.estimatedTimeRemaining === "") {
                        $scope.buildRunTime = finishedRunTimes.length !== 0 ? getDurationString(Math.max(...finishedRunTimes) - createdTime, true) : "";
                    } else {
                        $scope.buildRunTime = getDurationString(new Date().getTime() - createdTime, true);
                    }
                    $scope.parallelSummaryData = new google.visualization.DataTable();
                    $scope.parallelSummaryData.addColumn('string', 'Status');
                    $scope.parallelSummaryData.addColumn('number', 'Results');

                    $scope.parallelIndividualData = new google.visualization.DataTable();
                    $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

                    refresh_promise = $timeout($scope.getBuildReportData, 3000);
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        $scope.parallelSummaryData.addRow([replaceOnStatus(status, " "), testrungroup.groupSummary.resultsByStatus[status]]);
                        var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                        $scope.summaryChartOptions.colors.push(color);
                        $scope.individualChartOptions.colors.push(color);

                        $scope.parallelIndividualData.addColumn('number', replaceOnStatus(status, " "))
                    });

                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [testrun.project.name + " - " + testrun.name];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.parallelIndividualData.addRow(row);
                    });
                } else {
                    refresh_promise = $timeout($scope.getBuildReportData, 500);
                }
            }, function errorCallback() {
                refresh_promise = $timeout($scope.getBuildReportData, 3000);
            });
        };

        $scope.stopRefresh = function() {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
        $scope.getBuildReportData();



        $scope.$on('$destroy', function() {
            $scope.stopRefresh();
        });
    }]);
/**
 * User: jcorbett
 * Date: 7/22/13
 * Time: 4:01 PM
 */

angular.module("slickApp")
    .filter('reverse', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice().reverse();
        }
    });


/**
 * Created by jcorbett on 2/13/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/tps-report/:project/:release/:testplan*', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewTPSReportCtrl'
            })
    }])
    .controller('ViewTPSReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.serialChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "#000000",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };
        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');
        var refresh_promise;

        $scope.getTPSReportData = function() {
            rest.one('tps', $routeParams.project).one($routeParams.release, $routeParams.testplan).get().then(function (tpsreport) {
                $scope.serialChartOptions = {
                    chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                    backgroundColor: "#000000",
                    legend: {
                        textStyle: {
                            color: "#ffffff"
                        }
                    },
                    colors: []
                };
                $scope.testrungroup = tpsreport;
                var testrungroup = tpsreport;
                if (tpsreport.hasOwnProperty('name')) {
                    nav.setTitle(tpsreport.name);
                    $scope.serialData = new google.visualization.DataTable();
                    $scope.serialData.addColumn('date', 'Recorded');
                    _.sortBy($scope.testruns, function (testrun) {
                        return testrun.dateCreated;
                    });
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                        $scope.serialChartOptions.colors.push(color);
                        $scope.serialData.addColumn('number', replaceOnStatus(status, " "))
                    });
                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [new Date(testrun.dateCreated)];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.serialData.addRow(row);
                    });
                } else {
                    refresh_promise = $timeout($scope.getTPSReportData, 500);
                }
            }, function errorCallback() {
                refresh_promise = $timeout($scope.getTPSReportData, 3000);
            });
        };

        $scope.stopRefresh = function() {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
        $scope.getTPSReportData();



        $scope.$on('$destroy', function() {
            $scope.stopRefresh();
        });
    }]);
/**
 * Created by jcorbett on 2/17/14.
 */


angular.module("slickApp")
    .filter('firstHalf', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice(0, Math.ceil(items.length / 2));
        }
    });

/**
 * Created by jcorbett on 2/17/14.
 */


angular.module("slickApp")
    .filter('lastHalf', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice(Math.ceil(items.length / 2));
        }
    });

/**
 * Created by jason.corbett on 3/13/15.
 */


"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/settings/system-email', {
                templateUrl: 'static/resources/pages/email/system-email.html',
                controller: 'SystemEmailCtrl'
            })
            .when('/settings/email-subscription', {
                templateUrl: 'static/resources/pages/email/email-subscription.html',
                controller: 'EmailSubscriptionCtrl'
            });
        nav.addLink('Settings', 'System Email', 'settings/system-email');
        nav.addLink('Settings', 'Email Subscriptions', 'settings/email-subscription');
    }])
    .controller('SystemEmailCtrl', ['$scope', 'Restangular', 'NavigationService', function ($scope, rest, nav) {
        nav.setTitle("System Email Settings");
        $scope.smtpsettings = {};

        $scope.getSettings = function() {
            rest.all("system-configuration").getList({"config-type": "email-system-configuration"})
                .then(function(smtpsettings) {
                    if(smtpsettings.length > 0) {
                        $scope.smtpsettings = smtpsettings[0];
                        $scope.smtpsettingsForm.$setPristine();
                    }
                });
        };

        $scope.getSettings();

        $scope.revert = function () {
            $scope.getSettings();
        };

        $scope.save = function() {
            $scope.smtpsettings.smtpPort = Number($scope.smtpsettings.smtpPort);
            $scope.smtpsettings.configurationType = "email-system-configuration";
            if($scope.smtpsettings.id) {
                $scope.smtpsettings.put().then(function(smtpsettings) {
                    $scope.smtpsettings = smtpsettings;
                    $scope.smtpsettingsForm.$setPristine();
                })
            } else {
                rest.all("system-configuration").post($scope.smtpsettings).then(function(smtpsettings) {
                    $scope.smtpsettings = smtpsettings;
                    $scope.smtpsettingsForm.$setPristine();
                });
            }
        };
    }])
    .controller('EmailSubscriptionCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$location', '$cookieStore', function($scope, rest, nav, $routeParams, $location, $cookieStore) {
        $scope.subscriptionsFor = '';
        $scope.subscription = {};
        $scope.availableSubscriptions = [];
        $scope.emailAddress = "";
        $scope.projects = [];
        $scope.project = null;
        $scope.selectedProjectName = null;
        $scope.projectsById = {};
        $scope.releasesById = {};
        $scope.testplansById = {};
        $scope.testplansByProjectId = {};
        $scope.global = false;
        $scope.showAddSubscription = false;

        $scope.fetchSubscriptions = function() {
            rest.all("system-configuration").getList({"config-type": "email-subscription", "name": $scope.subscriptionsFor}).then(function(subscriptions) {
                if(subscriptions.length > 0) {
                    $scope.subscription = subscriptions[0];
                } else {
                    $scope.subscription.name = $scope.subscriptionsFor;
                    $scope.subscription.configurationType = "email-subscription";
                    $scope.subscription.subscriptions = [];
                    $scope.subscription.enabled = false;
                    rest.all("system-configuration").post($scope.subscription).then(function(subscription) {
                        $scope.subscription = subscription;
                    });
                }
            });
        };

        $scope.editSubscriptions = function() {
            $location.search("for", $scope.emailAddress);
        };
        if ($cookieStore.get('slick-last-project-used')) {
            $scope.selectedProjectName =  $cookieStore.get('slick-last-project-used');
        }

        if($routeParams.for) {
            $scope.subscriptionsFor = $routeParams.for;
            nav.setTitle("Email Subscriptions for " + $routeParams.for);
            rest.all("projects").getList().then(function(projects) {
                $scope.projects = projects;
                if(!$scope.selectedProjectName) {
                    $scope.selectedProjectName = projects[0].name;
                }
                _.each(projects, function(project) {
                    if($scope.selectedProjectName && project.name == $scope.selectedProjectName) {
                        $scope.project = project;
                    }
                    $scope.projectsById[project.id] = project;
                    if(project.releases) {
                        _.each(project.releases, function(release) {
                            $scope.releasesById[release.id] = {'release': release, 'project': project}
                        });
                    }
                });
                rest.all("testplans").getList().then(function(testplans) {
                    _.each(testplans, function(testplan) {
			if(testplan.project && testplan.project.id) {
                            if(!$scope.testplansByProjectId[testplan.project.id]) {
                                $scope.testplansByProjectId[testplan.project.id] = []
                            }
                            $scope.testplansByProjectId[testplan.project.id].push(testplan);
                            $scope.testplansById[testplan.id] = testplan;
	    		}
                    });
                    $scope.fetchSubscriptions();
                });
            });
        } else {
            nav.setTitle("Email Subscriptions");
        }

        $scope.getName = function(type, value) {
            if(type === "Project") {
                var projectName = value;
                if($scope.projectsById[value]) {
                    projectName = $scope.projectsById[value].name;
                }
                return "Any Testplan for project " + projectName + " any release.";
            } else if(type === "Release") {
                var projectName = "?";
                var releaseName = value;
                if($scope.releasesById[value]) {
                    projectName = $scope.releasesById[value].project.name;
                    releaseName = $scope.releasesById[value].release.name;
                }
                return "Any Testplan for project " + projectName + " for " + releaseName + " release.";
            } else if(type === "Testplan") {
                var testplanName = value;
                var projectName = "?";
                if($scope.testplansById[value]) {
                    testplanName = $scope.testplansById[value].name;
                    projectName = $scope.testplansById[value].project.name;
                }
                return "Testplan " + testplanName + " for project " + projectName + " any release.";
            } else if(type == "Global") {
                return "Global (spam me with everything you got)";
            }
            return "ERROR";
        };

        $scope.toggleShowAddSubscription = function() {
            $scope.showAddSubscription = !$scope.showAddSubscription;
        };

        $scope.selectProject = function(project) {
            $scope.project = project;
            $scope.selectedProjectName = project.name;
        };

        $scope.addReleaseSubscription = function (release) {
            var subscription = {
                subscriptionType: "Release",
                subscriptionValue: release.id
            };
            $scope.subscription.subscriptions.push(subscription);
            $scope.subscriptions.$setDirty();
            $scope.toggleShowAddSubscription();
        };

        $scope.addTestplanSubscription = function (testplan) {
            var subscription = {
                subscriptionType: "Testplan",
                subscriptionValue: testplan.id
            };
            $scope.subscription.subscriptions.push(subscription);
            $scope.subscriptions.$setDirty();
            $scope.toggleShowAddSubscription();
        };

        $scope.addProjectSubscription = function(project) {
            var subscription = {
                subscriptionType: "Project",
                subscriptionValue: project.id
            };
            $scope.subscription.subscriptions.push(subscription);
            $scope.subscriptions.$setDirty();
            $scope.toggleShowAddSubscription();
        };

        $scope.removeSubscription = function(rule) {
            $scope.subscription.subscriptions = _.without($scope.subscription.subscriptions, rule);
            $scope.subscriptions.$setDirty();
        };

        $scope.save = function() {
            $scope.subscription.put().then(function(subscription) {
                $scope.subscription = subscription;
                $scope.subscriptions.$setPristine();
            });
        };


        window.scope = $scope;

    }]);
/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/result-list/:project/:release/:build*', {
                templateUrl: 'static/resources/pages/result-list/result-list.html',
                controller: 'ResultListCtrl'
            })
    }])
    .controller('ResultListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.results = [];
        $scope.filter = {};
        $scope.resultQuery = {};
        $scope.resultList = {};
        $scope.moreDetailForResult = {};
        $scope.moreDetail = false;
        $scope.showAddNote = false;
        $scope.note = {
            result: null,
            message: '',
            externalLink: '',
            recurring: false,
            matchRelease: true,
            matchEnvironment: true
        };
        $scope.showDisplayFile = false;
        $scope.fileToDisplay = {};
        $scope.reason = "";
        $scope.showDisplayReason = false;
        $scope.logs = [];
        $scope.showDisplayLogs = false;
        $scope.recentlyFetchedTestrun = false;
        $scope.options = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.showTestcase = false;
        $scope.showAddStep = false;
        var title = "FAILED and BROKEN";
        var statusQuery = 'or(eq(status,"FAIL"),eq(status,"BROKEN_TEST"))';
        if ($routeParams['status']) {
            var statusList = $routeParams['status'].split(",");
            title = statusList.join(", ").replace(/,([^,]*)$/,' & '+'$1').replace(/_/g, " ");
            if (statusList.length > 1) {
                var finalList = [];
                for (var i = 0; i < statusList.length; i++) {
                    finalList.push('eq(status,"' + statusList[i] + '")');
                }
                statusQuery = 'or(' + finalList.join(",") + ')';
            } else {
                statusQuery = 'eq(status,"' + statusList[0] + '")'
            }

        }

        nav.setTitle(title + " results for " + $routeParams['project'] + " " + $routeParams['release'] + "." + $routeParams['build']);

        rest.one('projects', $routeParams['project']).get().then(function (project) {
            rest.one('projects', $routeParams['project']).one('releases', $routeParams['release']).get().then(function (release) {
                rest.one('projects', $routeParams['project']).one('releases', $routeParams['release']).one('builds', $routeParams['build']).get().then(function (build) {
                    rest.all('results').getList({q: 'and(eq(project.id,"' + project.id + '"),' + 'eq(release.releaseId,"' + release.id + '"),eq(build.buildId,"' + build.id + '"),' + statusQuery + ')'}).then(function(results) {
                        $scope.results = [];
                        //$scope.results = results;
                        _.each(results, function(result) {
                            if(result.started) {
                                result.recorded = result.started;
                            }
                            $scope.results.push(result);
                        });
                    });

                });
            });
        });


        $scope.getResultDuration = function(result) {
            if (result.runlength) {
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                return getDurationString(result.finished - result.started);
            }
        };

        $scope.getAbbreviatedReason = function(result) {
            if (result.reason) {
                var line = result.reason.split("\n")[0];
                return line;
            } else {
                return "";
            }
        };

        $scope.getImages = function(result) {
            return _.filter(result.files, function(file) { return /^image/.test(file.mimetype);});
        };

        $scope.addMoreDetail = function(result) {
            $scope.moreDetailForResult[result.id] = true;
        };

        $scope.removeDetail = function(result) {
            $scope.moreDetailForResult[result.id] = false;
        };

        $scope.addNote = function(result) {
            $scope.note.result = result;
            $scope.showAddNote = true;
        };

        $scope.addNoteDialogButtonClicked = function(buttonName) {
            if (buttonName == "Add") {
                var result = $scope.note.result;
                var note = $scope.note;
                var logEntry = {
                    entryTime: new Date().getTime(),
                    level: "WARN",
                    loggerName: "slick.note",
                    message: note.message,
                    exceptionMessage: note.externalLink
                };
                rest.one('results', result.id).post('log',logEntry).then(function(numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
                if (note.recurring) {
                    rest.one('testcases', result.testcase.testcaseId).get().then(function(testcase) {
                        if (! testcase.activeNotes) {
                            testcase.activeNotes = []
                        }
                        var recurringNote = {message: note.message};
                        if (note.url) {
                            recurringNote.url = note.url;
                        }
                        if (note.matchRelease) {
                            recurringNote.release = result.release;
                        }
                        if (note.matchEnvironment) {
                            recurringNote.environment = result.config;
                        }
                        testcase.activeNotes.push(recurringNote);
                        testcase.put();
                    });
                }
            }
            $scope.showAddNote = false;
            $scope.note = {
                result: null,
                message: '',
                externalLink: '',
                recurring: false,
                matchRelease: true,
                matchEnvironment: true
            };
        };

        $scope.getResultNotes = function(result) {
            return _.filter(result.log, function(logEntry) {
                return logEntry.level == "WARN" && logEntry.loggerName == "slick.note";
            });
        };

        $scope.displayFile = function(file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            if(file && file.mimetype && (file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml")) {
                rest.one('files', file.id).one('content', file.filename).get().then(function(text) {
                    $scope.fileToDisplay.text = text;
                });
            }
        };

        $scope.getFileViewer = function(file) {
            if(file && file.mimetype) {
                if (file.mimetype.indexOf("image") === 0) {
                    return "image";
                } else if(file.mimetype.indexOf("video") === 0) {
                    if (file.mimetype == "video/mp4") {
                        return "html5-video";
                    } else {
                        return "embed-video";
                    }
                } else if(file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml") {
                    return "text";
                }

            }
        };

        $scope.showTestcase = function(testcaseId, $event) {
            $event.preventDefault();
            rest.one('testcases', testcaseId).get().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.showTestcaseDialog = true;
            });
        };

        $scope.getUrlForFile = function(file) {
            return "api/files/" + file.id + "/content/" + file.filename;
        };

        $scope.displayFileDialogButtonClicked = function(buttonName) {
            $scope.showDisplayFile = false;
            $scope.fileToDisplay = {};
        };

        $scope.displayReason = function(result, $event) {
            $event.preventDefault();
            $scope.showDisplayReason = true;
            $scope.reason = result.reason;
        };

        $scope.displayReasonDialogButtonClicked = function(buttonName) {
            $scope.showDisplayReason = false;
            $scope.reason = "";
        };

        $scope.displayLogs = function(result, $event) {
            $event.preventDefault();
            $scope.logs = result.log;
            $scope.showDisplayLogs = true;
        };

        $scope.displayLogsDialogButtonClicked = function(buttonName) {
            $scope.logs = [];
            $scope.showDisplayLogs = false;
        };

        $scope.displayTestcaseDialogButtonClicked = function(buttonName) {
            $scope.showTestcaseDialog = false;
            $scope.testcase = {
                name: "",
                purpose: ""
            };
        };

        $scope.onHistoryClick = function(history) {
            rest.one('results', history.resultId).get().then(function(result) {
                $location.path('testruns/' + result.testrun.testrunId);
                if (result.status == "PASS") {
                    $location.search({result: result.id, all: "true"});
                } else {
                    $location.search({result: result.id});
                }
            });
        };

        $scope.cancelResults = function () {
            rest.one('testruns', $scope.testrun.id).one('cancel').get();
        };
        
        $scope.rescheduleStatus = function(status_name) {
            rest.one('testruns', $scope.testrun.id).one('reschedule', status_name).get();
        };
        
        $scope.rescheduleResult = function(result_id) {
            rest.one('results', result_id).one('reschedule').get();
        };

        window.scope = $scope;
    }]);


