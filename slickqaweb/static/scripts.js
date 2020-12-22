'use strict';

var _replace_underscore_regexp = new RegExp('_', 'g')

function replaceOnStatus(status, replace_with) {
    if (status) {
        return status.replace(_replace_underscore_regexp, replace_with)
    }
}

function phaseTypeToIcon(phaseType) {
    switch (phaseType) {
        case "unit":
            return "assignment";
        case "build":
            return "build";
        case "smoke":
            return "cloud";
        case "bats":
            return "assignment_turned_in";
        case "integration":
            return "group_work";
        case "regression":
            return "playlist_add_check";
        case "performance":
            return "trending_up";
        case "deploy":
            return "send";
        case "generic":
            return "all_inclusive";
        default: return "all_inclusive";
    }
}

function statusToColor(status) {
    switch (status) {
        case "PASS":
            return "#00b352";
        case "FAIL":
            return "#f96565";
        case "BROKEN_TEST":
            return "#ffd377";
        case "NOT_TESTED":
            return "#6EA9FF";
        case "NO_RESULT":
            return "#c0c0c0";
        case "SKIPPED":
            return "#A06744";
        case "CANCELLED":
            return "#a0522d";
        case "PASSED_ON_RETRY":
            return "#247549";
        default: return "unset";
    }
}

angular.module('slickApp', [ 'ngAnimate', 'ngRoute', 'ngResource', 'ngCookies', 'ngMaterial', 'ngAria', 'ngMdIcons', 'md.data.table', 'restangular', 'ngSanitize' ])
  .config(['$locationProvider', 'RestangularProvider', function ($locationProvider, RestangularProvider) {
    $locationProvider.html5Mode(true);
    RestangularProvider.setBaseUrl("api/");
  }])
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette("red")
            .accentPalette("blue-grey")
            .dark()
    });

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

function statusToIcon(status) {
    switch (status) {
        case 'PASS':
            return 'check_circle';
        case 'PASSED_ON_RETRY':
            return 'check_circle';
        case 'FAIL':
            return 'cancel';
        case 'BROKEN_TEST':
            return 'error';
        case 'NO_RESULT':
            return 'help';
        case 'SKIPPED':
            return 'watch_later';
        case 'NOT_TESTED':
            return 'pause_circle_filled';
    }
}

function isObject(object) {
    return typeof object === 'object';
}

function objectToValues(object) {
    if (object) {
        return Object.values(object);
    } else {
        return []
    }
}

function objectToKeys(object) {
    if (object) {
        return Object.keys(object)
    } else {
        return []
    }
}

function summaryToStatus(summary) {
    if (summary) {
        if (summary.resultsByStatus.PASS + summary.resultsByStatus.NOT_TESTED === summary.total) {
            return 'PASS';
        } else if (summary.resultsByStatus.PASS + summary.resultsByStatus.PASSED_ON_RETRY + summary.resultsByStatus.NOT_TESTED === summary.total) {
            return 'PASSED_ON_RETRY';
        } else if (summary.resultsByStatus.FAIL) {
            return 'FAIL';
        } else if (summary.resultsByStatus.BROKEN_TEST) {
            return 'BROKEN_TEST';
        } else if (summary.resultsByStatus.NOT_TESTED && !summary.resultsByStatus.SKIPPED) {
            return 'NOT_TESTED';
        } else if (summary.resultsByStatus.SKIPPED) {
            return 'SKIPPED';
        }
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
           icon: "bookmarks",
           links: [
           ]},
          {name: "Reports",
           show: false,
           icon: "equalizer",
           links: [
          ]},
          {name: "Run Tests",
           show: false,
           icon: "done_all",
           links: [
          ]},
          {name: "Settings",
           show: false,
           icon: "settings",
           links: [
           ]},
          {name: "Project Management",
           show: false,
           icon: "explore",
           links: [
          ]},
          {name: "Test Management",
           show: false,
           icon: "create",
           links: [
          ]},
          {name: "Dashboards",
           show: false,
           icon: "dashboard",
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

      this.$get = ['$cookies', '$window', function(cookieStore, $window) {
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
            transclude: true,
            replace: true,
            require: "^slickListHeader",
            template: "<tr style=\"border-bottom: 2px solid\" class=\"slick-list-columns\" ng-transclude></tr>",
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
            transclude: true,
            replace: true,
            require: "^slickListColumns",
            scope: {
               sortable: "@",
               sortPropertyName: "@"
            },
            template: "<th align=\"left\" class=\"slick-list-column\" ng-click=\"setOrderBy()\"><span ng-transclude></span><img class=\"slick-list-column-sort-image\" src=\"static/images/sort-down.png\" ng-show=\"currentlySorted() && !sortReversed()\" /><img class=\"slick-list-column-sort-image\" src=\"static/images/sort-up.png\" ng-show=\"currentlySorted() && sortReversed()\" /></th>",
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
                controller: 'MainCtrl',
                reloadOnSearch: false
            });
    }])
    .filter('unique', function () {
        return function (arr, field) {
            return _.uniq(arr, function (a) {
                return a[field];
            });
        };
    })
    .config(function ($sceDelegateProvider) {
        let allowed = [];
        try {
            if (environment && environment.iframeConfig) {
                allowed = environment.iframeConfig.map(a => `${a.url}**`);
            }
        } catch (e) {
            console.log("No environment file. That's ok.")
        }
        allowed.push("self");
        $sceDelegateProvider.resourceUrlWhitelist(allowed);
    })
    .controller('MainCtrl', ['$scope', 'Restangular', '$interval', '$timeout', '$routeParams', '$cookies', '$location', 'NavigationService', function ($scope, rest, $interval, $timeout, $routeParams, $cookies, $location, nav) {
        try {
            $scope.environment = environment;
        } catch (e) {
            //    Don't log again but still catch.
        }

        nav.setTitle("Slick");
        $scope.currentTimeMillis = new Date().getTime();

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;
        $scope.getDurationString = getDurationString;
        $scope.isObject = isObject;
        $scope.objToValues = objectToValues;

        const allProjects = 'All';

        $scope.project = $cookies.get("projectFilter");
        if ($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }

        if (!$scope.project) {
            $scope.project = allProjects;
        }

        const buildsTabName = 'Builds';
        $scope.buildList = [];
        $scope.buildsQuery = $cookies.getObject("buildsQuery");
        if ($scope.buildsQuery && $routeParams["release"]) {
            $scope.buildsQuery.search = {release: {name: $routeParams["release"]}}
        }
        if (!$scope.buildsQuery) {
            let search = {}
            if ($routeParams["release"]) {
                search = {release: {name: $routeParams['release']}}
            }
            $scope.buildsQuery = {
                index: 0,
                order: '-report.testruns[0].dateCreated',
                limit: 25,
                queryLimit: 25,
                page: 1,
                search: search
            };
        }
        $scope.setBuildsSort = function (order) {
            $scope.buildsQuery.order = order;
        };

        const testrunsTabName = 'Testruns';
        $scope.testrunList = [];
        $scope.testrunsQuery = $cookies.getObject("testrunsQuery");
        if (!$scope.testrunsQuery) {
            $scope.testrunsQuery = {
                index: 1,
                order: '-runStarted',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setTestrunsSort = function (order) {
            $scope.testrunsQuery.order = order;
        };

        const testrungroupsTabName = 'TestrunGroups';
        $scope.testrungroupList = [];
        $scope.testrunGroupsQuery = $cookies.getObject("testrunGroupsQuery");
        if (!$scope.testrunGroupsQuery) {
            $scope.testrunGroupsQuery = {
                index: 2,
                order: '-created',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setTestrunGroupsSort = function (order) {
            $scope.testrunGroupsQuery.order = order;
        };

        const pipelinesTabName = 'Pipelines';
        $scope.pipelinesList = [];
        $scope.pipelinesQuery = $cookies.getObject("pipelinesQuery");
        if (!$scope.pipelinesQuery) {
            $scope.pipelinesQuery = {
                index: 2,
                order: '-started',
                limit: 25,
                queryLimit: 25,
                page: 1
            };
        }
        $scope.setPipelinesSort = function (order) {
            $scope.pipelinesQuery.order = order;
        };

        if (!$cookies.getObject('pipelineShowFilter')) {
            $cookies.putObject('pipelineShowFilter', {
                name: true,
                project: true,
                release: true,
                build: true,
                started: true
            });
        }
        $scope.show = $cookies.getObject('pipelineShowFilter');

        $scope.$watch('showFilter.$dirty', function (newValue, oldValue) {
            if (newValue) {
                $cookies.putObject('pipelineShowFilter', $scope.show);
                $scope.showFilter.$setPristine();
            }
        });

        $scope.limits = [25, 50, 100, 200];

        const statisticsTabName = 'Statistics';

        $scope.tabNameToIndex = function (tabName) {
            switch (tabName) {
                case buildsTabName:
                    return 0;
                case testrunsTabName:
                    return 1;
                case testrungroupsTabName:
                    return 2;
                case pipelinesTabName:
                    return 3;
                case statisticsTabName:
                    return 4;
                default:
                    return parseInt(tabName);
            }
        };

        $scope.isTabSelected = function (index) {
            return index === $scope.selectedIndex;
        };

        $scope.selectedIndex = $scope.tabNameToIndex($location.search().mainTab) || $scope.tabNameToIndex($cookies.get("selectedIndex")) || 0;

        $scope.onTabSelected = function (index) {
            switch (index) {
                case buildsTabName:
                    firstBuildsFetch ? undefined : $scope.fetchBuildsData(true);
                    break;
            }
            $cookies.put("selectedIndex", index);
            $location.search("mainTab", index);
            $scope.selectedIndex = $scope.tabNameToIndex(index);
            $scope.fetchData();
        };

        let stop;
        let builds;
        let pipelines;
        let check;

        // $scope.statTabNameToIndex = function (statTabName) {
        //     if ($scope.statsForProjects) {
        //         let index = $scope.statsForProjects.findIndex(function (stat) {
        //             return stat.title === statTabName || 0;
        //         });
        //         if (index !== -1) {
        //             return index;
        //         } else {
        //             return 0;
        //         }
        //     }
        // };

        // $scope.onStatTabSelected = function (index) {
        // $cookies.put("selectedStatIndex", index);
        // $location.search("statsTab", index);
        // $scope.selectedStatIndex = $scope.statTabNameToIndex(index);
        // };

        // $scope.isStatTabSelected = function (index) {
        //     return index === $scope.selectedStatIndex;
        // };

        $scope.statsForProjects = [];
        $scope.testcasesByProject = {};
        let statsByProject = {};

        let focused = true;

        window.onfocus = function () {
            focused = true;
        };

        window.onblur = function () {
            focused = false;
        };

        $scope.getStatsForProjects = function () {
            return rest.one('results').one('queue', 'running').get({byProject: "true"}).then(function (resultsByProject) {
                _.each(resultsByProject, function (project) {
                    if (!project._id.release || project._id.release === "") {
                        return;
                    }
                    statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                    statsByProject[project._id.project]['title'] = project._id.project;
                    statsByProject[project._id.project]['activeRelease'] = statsByProject[project._id.project]['activeRelease'] || project._id.release;
                    statsByProject[project._id.project][project._id.release] = statsByProject[project._id.project][project._id.release] || {};
                    statsByProject[project._id.project][project._id.release]['title'] = project._id.release;
                    statsByProject[project._id.project][project._id.release]['running'] = project;
                    statsByProject[project._id.project][project._id.release]['running']['title'] = "Running Now";
                });
                _.each([1, 7, 14, 30], function (days) {
                    rest.one('results').one('queue', 'finished').get({days: days}).then(function (finishedByProject) {
                        _.each(finishedByProject, function (project) {
                            if (!project._id.release || project._id.release === "") {
                                return;
                            }
                            statsByProject[project._id.project] = statsByProject[project._id.project] || {};
                            statsByProject[project._id.project]['title'] = project._id.project;
                            statsByProject[project._id.project]['activeRelease'] = statsByProject[project._id.project]['activeRelease'] || project._id.release;
                            statsByProject[project._id.project][project._id.release] = statsByProject[project._id.project][project._id.release] || {};
                            statsByProject[project._id.project][project._id.release]['title'] = project._id.release;
                            statsByProject[project._id.project][project._id.release][days] = statsByProject[project._id.project][project._id.release][days] || {};
                            statsByProject[project._id.project][project._id.release][days]['title'] = days !== 1 ? `Past ${days} days` : "Today";
                            statsByProject[project._id.project][project._id.release][days][project._id.status] = project;
                            statsByProject[project._id.project][project._id.release]['running'] = statsByProject[project._id.project][project._id.release]['running'] || {count: 0, _id: {project: project._id.project}};
                            statsByProject[project._id.project][project._id.release]['running']['title'] = "Running Now";
                        });
                    });
                    rest.one('testcases').one('recently-created').get({days: days}).then(function (createdByProject) {
                        _.each(createdByProject, function (project) {
                            $scope.testcasesByProject[project._id.project] = $scope.testcasesByProject[project._id.project] || {};
                            $scope.testcasesByProject[project._id.project][days] = $scope.testcasesByProject[project._id.project][days] || {};
                            $scope.testcasesByProject[project._id.project][days]['title'] = days !== 1 ? `Past ${days} days` : "Today";
                            $scope.testcasesByProject[project._id.project][days]['count'] = project
                        });
                    });
                });
                let statsForProjectsList = [];
                _.each(Object.values(statsByProject), function (stat) {
                    _.each(stat, function (releaseValue, releaseKey) {
                        _.each(releaseValue, function (rangeValue, rangeKey) {
                            if (rangeKey !== 'running') {
                                if (typeof stat[releaseKey][rangeKey] === "object") {
                                    stat[releaseKey][rangeKey].total = Object.values(rangeValue).filter((status) => status && status.count !== undefined).reduce(function (sum, derp) {
                                        return sum + derp.count
                                    }, 0);
                                }
                            }
                        });
                    });
                    statsForProjectsList.push(stat)
                });
                // $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
                return statsForProjectsList.sort((a, b) => a.title.localeCompare(b.title, navigator.languages[0] || navigator.language, {numeric: true, ignorePunctuation: true}));
            });
        };

        $scope.checkForStatsForProject = function () {
            if ($scope.statsForProjects && $scope.statsForProjects.length !== 0) {
                $interval.cancel(check);
                check = undefined;
                $scope.getHealthData($scope.statsForProjects[0].title, $scope.statsForProjects[0].activeRelease);
            } else if (!check) {
                check = $interval($scope.checkForStatsForProject, 500)
            }
        };

        $scope.checkForStatsForProject();

        let firstFetch = true;
        $scope.fetchData = function () {
            if (focused || firstFetch) {
                if (firstFetch || $scope.statsForProjects.length === 0) {
                    if ($scope.selectedIndex === $scope.tabNameToIndex(statisticsTabName) || firstFetch) {
                        $scope.getStatsForProjects().then(function (response) {
                            $scope.statsForProjects = response;
                            // $scope.selectedStatIndex = $scope.statTabNameToIndex($location.search().statsTab) || $scope.statTabNameToIndex($cookies.get("selectedStatIndex")) || 0;
                        });
                    }
                }
                $scope.currentTimeMillis = new Date().getTime();
                let testrunsQuery = {orderby: '-runStarted', limit: $scope.testrunsQuery.queryLimit};
                if ($scope.project) {
                    $cookies.put("projectFilter", $scope.project)
                }
                if ($scope.project && $scope.project !== allProjects) {
                    testrunsQuery["project.name"] = $scope.project;
                }
                $cookies.putObject("buildsQuery", $scope.buildsQuery);
                $cookies.putObject("testrunsQuery", $scope.testrunsQuery);
                $cookies.putObject("testrunGroupsQuery", $scope.testrunGroupsQuery);
                if ($scope.selectedIndex === $scope.tabNameToIndex(testrunsTabName) || firstFetch) {
                    rest.all('testruns').getList(testrunsQuery).then(function (testruns) {
                        $scope.testrunList = testruns
                    });
                }
                if ($scope.selectedIndex === $scope.tabNameToIndex(testrungroupsTabName) || firstFetch) {
                    rest.all('testrungroups').getList({orderby: '-created', limit: $scope.testrunGroupsQuery.queryLimit}).then(function (testrungroups) {
                        $scope.testrungroupList = testrungroups
                    });
                }
            }
            if (!stop) {
                stop = $interval($scope.fetchData, 3000)
                firstFetch = false;
            }
        };

        let firstBuildsFetch = true;
        $scope.fetchBuildsData = function (disablePolling) {
            if (focused || firstBuildsFetch) {
                // recent builds are a little tricky
                let buildList = [];

                function processBuildList(buildList) {
                    buildList = _.sortBy(buildList, function (build) {
                        if (build.build.built) {
                            return build.build.built;
                        } else {
                            return 0;
                        }
                    });
                    buildList.reverse();
                    let tempBuildList = [];
                    let promises = [];
                    _.each(buildList.slice(0, $scope.buildsQuery.queryLimit), function (buildInfo) {
                        promises.push(rest.one('build-report', buildInfo.project.name).one(buildInfo.release.name, buildInfo.build.name).get().then(function (buildReport) {
                            buildInfo.report = buildReport;
                            tempBuildList.push(buildInfo)
                        }))
                    });
                    Promise.all(promises).then(function () {
                        $scope.buildList = tempBuildList;
                        if (!disablePolling) {
                            builds = $timeout($scope.fetchBuildsData, 10000)
                        }
                        firstBuildsFetch = false;
                    });
                }

                if (!$scope.projects || $scope.project === allProjects) {
                    rest.all('projects').getList({dashboard: true, limit: $scope.buildsQuery.limit, orderby: '-releases.builds.built'}).then(function (projects) {
                        $scope.projects = projects;
                        if ($scope.selectedIndex === $scope.tabNameToIndex(buildsTabName) || firstBuildsFetch) {
                            if (!$scope.project || $scope.project === allProjects) {
                                _.each(projects, function (project) {
                                    _.each(project.releases, function (release) {
                                        _.each(release.builds, function (build) {
                                            // This creates a flat list that we can sort
                                            buildList.push({build: build, project: project, release: release});
                                        });
                                    });
                                });
                                processBuildList(buildList);
                            } else {
                                rest.one('projects', $scope.project).get({quick: true}).then(function (project) {
                                    _.each(project.releases, function (release) {
                                        _.each(release.builds, function (build) {
                                            // This creates a flat list that we can sort
                                            buildList.push({build: build, project: project, release: release});
                                        });
                                    });
                                    processBuildList(buildList);
                                });
                            }
                        }
                    });
                } else if ($scope.project) {
                    if ($scope.selectedIndex === $scope.tabNameToIndex(buildsTabName) || firstBuildsFetch) {
                        rest.one('projects', $scope.project).get({quick: true}).then(function (project) {
                            _.each(project.releases, function (release) {
                                _.each(release.builds, function (build) {
                                    // This creates a flat list that we can sort
                                    buildList.push({build: build, project: project, release: release});
                                });
                            });
                            processBuildList(buildList);
                        });
                    }
                }
            } else {
                if (!disablePolling) {
                    builds = $timeout($scope.fetchBuildsData, 1000)
                }
            }
        };

        let firstPipelineFetch = true;
        $scope.fetchPipelinesData = function () {
            if (focused || firstPipelineFetch) {
                if ($scope.selectedIndex === $scope.tabNameToIndex(pipelinesTabName) || firstPipelineFetch) {
                    let pipelinesQuery = {orderby: '-started', limit: $scope.pipelinesQuery.queryLimit};
                    if ($scope.project && $scope.project !== allProjects) {
                        pipelinesQuery["project.name"] = $scope.project;
                        $cookies.put("projectFilter", $scope.project)
                    }
                    $cookies.putObject("pipelinesQuery", $scope.pipelinesQuery);
                    rest.all('pipelines').getList(pipelinesQuery).then(function (pipelines) {
                        $scope.pipelinesList = pipelines;
                    });
                }
            }
            if (!pipelines) {
                pipelines = $interval($scope.fetchPipelinesData, 1000);
                firstPipelineFetch = false;
            }
        };

        $scope.healthReportOptionsByProject = {};
        $scope.healthDataByProject = {};

        let params = {limit: $scope.buildsQuery.queryLimit, groupType: "PARALLEL"};
        if ($routeParams["limit"]) {
            params.limit = $routeParams["limit"];
        }

        let healthTimeout;

        $scope.getHealthData = function (project, release) {
            if (angular.isDefined(healthTimeout)) {
                $timeout.cancel(healthTimeout)
            }
            if ($scope.selectedIndex === $scope.tabNameToIndex(statisticsTabName)) {
                rest.one('release-report', project).one(release).get(params).then(function (releaseReport) {
                    $scope.healthReportOptionsByProject[project] = {
                        chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                        backgroundColor: "none",
                        vAxis: {
                            minValue: 0,
                            maxValue: 100,
                            format: '#\'%\''
                        },
                        lineWidth: 5,
                        legend: {
                            textStyle: {
                                color: "#ffffff"
                            }
                        },
                        width: '100%',
                        colors: []
                    };
                    if (releaseReport.hasOwnProperty('name')) {
                        $scope.healthDataByProject[project] = new google.visualization.DataTable();
                        $scope.healthDataByProject[project].addColumn('date', 'Recorded');
                        let gotXAndY = false;
                        _.each(releaseReport.builds.sort(function (a, b) {
                            return (a.testruns[0].dateCreated > b.testruns[0].dateCreated) ? 1 : ((b.testruns[0].dateCreated > a.testruns[0].dateCreated) ? -1 : 0);
                        }), function (build, index) {
                            let row = [new Date(build.testruns[0].dateCreated)];
                            let sum = Object.values(build.groupSummary.resultsByStatus).reduce((a, b) => a + b, 0);
                            if (!gotXAndY) {
                                _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                    let color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                                    $scope.healthReportOptionsByProject[project].colors.push(color);
                                    $scope.healthDataByProject[project].addColumn('number', replaceOnStatus(status, " "));
                                });
                                gotXAndY = true;
                                //$scope.healthDataByProject[project].addColumn('string', 'Build');
                            }
                            _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                row.push(build.groupSummary.resultsByStatus[status] / sum * 100);
                            });
                            // row.push(`${build.testruns[0].project.name}/${build.testruns[0].release.name}/${build.testruns[0].build.name}`);
                            $scope.healthDataByProject[project].addRow(row);
                            $scope.healthDataByProject[project].setRowProperties(index, {project: build.testruns[0].project.name, release: build.testruns[0].release.name, build: build.testruns[0].build.name})
                        });
                        healthTimeout = $timeout(function () {
                            $scope.getHealthData(project, $scope.statsForProjects[$scope.statsForProjects.findIndex(function (stat) {
                                return stat.title === project || 0;
                            })].activeRelease);
                        }, 10000);
                    }
                }, function errorCallback(error) {
                    console.log(error)
                });
            }
        };

        $scope.stopRefresh = function () {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
            if (angular.isDefined(builds)) {
                $timeout.cancel(builds);
                builds = undefined;
            }
            if (angular.isDefined(pipelines)) {
                $interval.cancel(pipelines);
                pipelines = undefined;
            }
            if (angular.isDefined(check)) {
                $interval.cancel(check);
                check = undefined;
            }

            if (angular.isDefined(healthTimeout)) {
                $timeout.cancel(healthTimeout);
                healthTimeout = undefined;
            }
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.fetchData();
        $scope.fetchPipelinesData();
        $scope.fetchBuildsData();
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

        $scope.toggleShow = function (group, $event) {
            group.show = !group.show;
            $event.preventDefault();
        };

        $scope.toggleMode = function ($event) {
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
    .controller('ViewAndUpdateProjectCtrl', ['$scope', 'NameBasedRestangular', 'NavigationService', '$routeParams', '$cookies', function($scope, rest, nav, $routeParams, $cookies) {
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
            $cookies.put('slick-last-project-used', project.name);
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
    .controller('TestcaseTreeCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', '$location', '$cookies', function ($scope, projrest, rest, nav, $routeParams, $location, $cookies) {
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
            $cookies.put('slick-last-project-used', $routeParams['project']);
        } else if ($cookies.get('slick-last-project-used')) {
            $scope.selectedProjectName =  $cookies.get('slick-last-project-used');
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
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookies', '$location', 'UserService', function ($scope, rest, nav, $routeParams, $cookies, $location, user) {
        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];

        $scope.user = user.currentUser;
        $scope.editOn = false;


        if (!$routeParams["project"] && $cookies.get('slick-last-project-used')) {
            $location.search("project", $cookies.get('slick-last-project-used'));
        }
        $scope.$watch('project', function (newValue, oldValue) {
            if (newValue && oldValue !== newValue) {
                $location.search("project", newValue.name || newValue);
                $location.search("release", null);
                $location.search("testplanId", null);
            }
        });

        nav.setTitle("Testruns");
        rest.all('projects').getList().then(function (projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($routeParams["project"]) {
                $scope.project = _.find(projects, function (project) {
                    return $routeParams["project"] === project.name;
                });
                if ($scope.project) {
                    $scope.releases = $scope.project.releases;
                    if ($routeParams["release"]) {
                        $scope.release = _.find($scope.releases, function (release) {
                            return $routeParams["release"] === release.name;
                        });
                    }
                    $scope.$watch('release', function (newValue, oldValue) {
                        if (newValue) {
                            $location.search('release', newValue.name || newValue);
                        }
                    });
                    rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function (testplans) {
                        $scope.testplans = testplans;
                        if ($routeParams["testplanid"]) {
                            $scope.testplan = _.find($scope.testplans, function (testplan) {
                                return $routeParams["testplanid"] === testplan.id;
                            });
                        }
                        $scope.$watch('testplan', function (newValue, oldValue) {
                            if (newValue) {
                                $location.search("testplanid", newValue.id || newValue);
                            }
                        });
                    });
                }

            }
        });

        $scope.fetchTestruns = function (full) {
            var testrunQuery = [];
            if ($routeParams["project"] || $scope.project) {
                testrunQuery.push("eq(project.name,\"" + $routeParams["project"] + "\")");
            }
            if ($routeParams["release"] || $scope.release) {
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
                if (full) {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 525}).then(function (testruns) {
                        $scope.testruns = testruns;
                    });
                } else {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 25}).then(function (testruns) {
                        $scope.testruns = testruns;
                        rest.all('testruns').getList({orderby: '-dateCreated', limit: 500, skip: 25}).then(function (therest) {
                            _.each(therest, function (testrun) {
                                $scope.testruns.push(testrun)
                            });
                        });
                    });
                }
            } else {
                if (full) {
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

        $scope.getDisplayName = function (testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.isEmpty = function (obj) {
            return _.isEmpty(obj);
        };

        $scope.toggleEdit = function () {
            $scope.editOn = !$scope.editOn;
        };

        $scope.deleteTestrun = function (testrun) {
            rest.one('testruns', testrun.id).remove().then(function () {
                $scope.fetchTestruns(true);
            })
        };

        window.scope = $scope;

    }])
    .controller('TestrunSummaryCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', '$cookies', '$mdDialog', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location, $cookies, $mdDialog) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.query = {
            order: 'name',
            limit: 25,
            page: 1
        };
        $scope.limitOptions = [25, 50, 100, 200];

        $scope.expandedResults = {};

        $scope.isExpanded = function (resultId) {
            return !!$scope.expandedResults[resultId];
        };

        $scope.statusToIcon = statusToIcon;

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
            backgroundColor: "none",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };
        if (!$cookies.getObject('testrunShowFilter')) {
            $cookies.putObject('testrunShowFilter', {
                author: true,
                component: false,
                recorded: true,
                duration: true,
                hostname: true,
                automationid: false,
                resultid: false
            });
        }
        $scope.show = $cookies.getObject('testrunShowFilter');

        $scope.testcases = {};

        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.showTestcase = false;
        $scope.showAddStep = false;

        $scope.testrunHistory = [];

        if ($routeParams.only) {
            $scope.filter[$routeParams.only] = true;
        }

        if ($routeParams.result) {
            $scope.resultList.searchField = {$: $routeParams.result};
        }

        $scope.repeatOffendersList = {};
        $scope.processingOffenders = true;
        $scope.topContributors = {};
        $scope.keyLength = function (obj) {
            return Object.keys(obj).length;
        };

        let tpsTimeout;
        let testrunTimeout;

        let focused = true;

        window.onfocus = function () {
            focused = true;
        };

        window.onblur = function () {
            focused = false;
        };

        $scope.fetchTestrun = function () {
            if (focused && $routeParams["testrunid"]) {
                rest.one('testruns', $routeParams["testrunid"]).get().then(function (testrun) {
                        $scope.testrun = testrun;
                        $scope.getTPSReportData();
                        $scope.data = new google.visualization.DataTable();
                        $scope.data.addColumn('string', 'Status');
                        $scope.data.addColumn('number', 'Results');
                        var emptyFilter = _.isEmpty($scope.filter);
                        if (emptyFilter) {
                            $scope.filter = {};
                        }
                        $scope.options.colors = [];
                        _.each(testrun.summary.statusListOrdered, function (status) {
                            $scope.data.addRow([replaceOnStatus(status, " "), testrun.summary.resultsByStatus[status]]);
                            $scope.options.colors.push(getStyle(replaceOnStatus(status, "") + "-element", "color"));
                            if (emptyFilter) {
                                $scope.filter[status] = status !== "PASS";
                                if ($routeParams.all) {
                                    $scope.filter[status] = true;
                                }
                            }
                            if (status === "FAIL" || status === "BROKEN_TEST") {
                                rest.one('results', 'count').get({
                                    "q": `and(eq(testrun__testrunId,"${$routeParams['testrunid']}"),eq(status,"${status}"),or(ne(log__loggerName,"slick.note"),and(eq(log__loggerName,"slick.note"),ne(log__level, "WARN"))))`
                                }).then(function (count) {
                                    $scope.withoutNotesStats[status] = count;
                                });
                            }
                        });

                        $scope.recentlyFetchedTestrun = true;
                        $scope.testrunQuery();

                        if ($scope.results.length !== 0) {
                            if (Object.keys($scope.repeatOffendersList).length === 0 && Object.keys($scope.topContributors).length === 0) {
                                let repeatOffenders = {};
                                _.each($scope.results, function (result) {
                                    if (result.status === "FAIL" || result.status === "BROKEN_TEST") {
                                        $scope.topContributors[result.testcase.author || "No Author"] = $scope.topContributors[result.testcase.author] + 1 || 1;
                                    }
                                    _.each(result.history, function (historyItem) {
                                        if (historyItem.status === "FAIL" || historyItem.status === "BROKEN_TEST") {
                                            repeatOffenders[historyItem.status] = repeatOffenders[historyItem.status] || {};
                                            repeatOffenders[historyItem.status][result.testcase.name] = repeatOffenders[historyItem.status][result.testcase.name] || {};
                                            repeatOffenders[historyItem.status][result.testcase.name]["status"] = historyItem.status;
                                            repeatOffenders[historyItem.status][result.testcase.name]["name"] = result.testcase.name;
                                            repeatOffenders[historyItem.status][result.testcase.name]["count"] = repeatOffenders[historyItem.status][result.testcase.name]["count"] + 1 || 1;
                                            repeatOffenders[historyItem.status][result.testcase.name]["testcases"] = repeatOffenders[historyItem.status][result.testcase.name]["testcases"] || [];
                                            repeatOffenders[historyItem.status][result.testcase.name]["testcases"].push(historyItem);
                                        }
                                    });
                                });
                                _.each(repeatOffenders, function (status) {
                                    _.each(status, function (testcase) {
                                        if (testcase.count > 4) {
                                            $scope.repeatOffendersList[testcase.status] = $scope.repeatOffendersList[testcase.status] || [];
                                            $scope.repeatOffendersList[testcase.status].push({name: testcase.name, count: testcase.count, testcases: testcase.testcases})
                                        }
                                    });
                                });
                                $scope.processingOffenders = false;
                            }
                        }
                        nav.setTitle("Summary: " + $scope.getDisplayName(testrun));
                        $scope.goToBuildReportButton = {
                            href: `build-report/${testrun.project.name}/${testrun.release.name}/${testrun.build.name}`,
                            name: "Back to Build Report"
                        };
                        $scope.goToTPSReportButton = {
                            href: testrun.testplan ? `tps-report/${testrun.project.name}/${testrun.release.name}/${testrun.testplan.name}` : undefined,
                            name: "TPS Report"
                        };
                        $scope.estimatedTimeRemaining = testrun.state !== 'FINISHED' ? getEstimatedTimeRemaining(testrun, 'testrun') : "";

                        if (!testrun.info && testrun.project && testrun.release && testrun.build) {
                            projrest.one('projects', testrun.project.name).one('releases', testrun.release.name).one('builds', testrun.build.name).get().then(function (build) {
                                testrun.info = build.description;
                            });
                        }

                    }
                );
            } else {
                $scope.testrunQuery()
            }
        };

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.tpsReportOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "none",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };
        $scope.tpsData = new google.visualization.DataTable();
        $scope.tpsData.addColumn('string', 'Testrun Name');
        var refresh_promise;

        $scope.getTPSReportData = function () {
            if (focused) {
                rest.one('tps', $scope.testrun.project.name).one($scope.testrun.release.name, $scope.testrun.name).get().then(function (tpsreport) {
                    $scope.tpsReportOptions = {
                        chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                        backgroundColor: "none",
                        legend: {
                            textStyle: {
                                color: "#ffffff"
                            },
                        },
                        vAxis: {
                            minValue: 0,
                            maxValue: 100,
                            format: '#\'%\''
                        },
                        lineWidth: 5,
                        colors: []
                    };
                    $scope.testrungroup = tpsreport;
                    var testrungroup = tpsreport;
                    if (tpsreport.hasOwnProperty('name')) {
                        $scope.testrunHistory = [];
                        $scope.tpsData = new google.visualization.DataTable();
                        $scope.tpsData.addColumn('date', 'Recorded');
                        _.sortBy($scope.testruns, function (testrun) {
                            return testrun.dateCreated;
                        });
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                            $scope.tpsReportOptions.colors.push(color);
                            $scope.tpsData.addColumn('number', replaceOnStatus(status, " "))
                        });
                        _.each(testrungroup.testruns, function (testrun, index) {
                            $scope.testrunHistory.unshift(testrun)
                            var row = [new Date(testrun.dateCreated)];
                            let sum = Object.values(testrun.summary.resultsByStatus).reduce((a, b) => a + b, 0);
                            _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                                row.push(testrun.summary.resultsByStatus[status] / sum * 100);
                            });
                            $scope.tpsData.addRow(row);
                            $scope.tpsData.setRowProperties(index, {testrun: testrun.id});
                        });
                    } else {
                        tpsTimeout = $timeout($scope.getTPSReportData, 15000);
                    }
                }, function errorCallback() {
                    tpsTimeout = $timeout($scope.getTPSReportData, 3000);
                });
            } else {
                tpsTimeout = $timeout($scope.getTPSReportData, 3000);
            }
        };

        $scope.resultGraphs = {};

        $scope.getGraphDataFromResult = function (result) {
            let reportOptions = {
                chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                backgroundColor: "none",
                hAxis: {
                    title: 'Time',
                    titleTextStyle: {
                        color: "#ffffff"
                    },
                    textStyle: {
                        color: "#ffffff"
                    }
                },
                vAxis: {
                    title: 'Values',
                    textStyle: {
                        color: "#ffffff"
                    },
                    titleTextStyle: {
                        color: "#ffffff"
                    }
                },
                legend: {
                    textStyle: {
                        color: "#ffffff"
                    },
                },
                lineWidth: 5,
            };
            let reportData = new google.visualization.DataTable();
            _.each(result.graph.columns, function (column) {
                reportData.addColumn(column.type, column.name)
            });
            _.each(result.graph.values, function (value) {
                let row = [new Date(value.date)];
                _.each(value.measurements, function (measurement) {
                    row.push(measurement);
                });
                reportData.addRow(row);
            });
            $scope.resultGraphs[result.id] = {options: reportOptions, data: reportData}
        };

        $scope.fetchTestrun();

        $scope.testrunQuery = function (disablePolling) {
            if (focused) {
                var oldQuery = $scope.resultQuery.q;
                var includableStatuses = _.filter(_.keys($scope.filter), function (key) {
                    return $scope.filter[key] && key !== 'withoutnotes'
                });
                var andQuery = ["eq(testrun__testrunId,\"" + $routeParams["testrunid"] + "\")"];
                if (includableStatuses.length === 1) {
                    andQuery.push("eq(status,\"" + includableStatuses[0] + "\")")
                } else if (includableStatuses.length > 1) {
                    var statuses = [];
                    _.each(includableStatuses, function (status) {
                        statuses.push("eq(status,\"" + status + "\")");
                    });
                    andQuery.push("or(" + statuses.join(',') + ")")
                }
                if ($scope.filter['withoutnotes']) {
                    andQuery.push('or(ne(log__loggerName,"slick.note"),and(eq(log__loggerName,"slick.note"),ne(log__level, "WARN")))')
                }
                $scope.resultQuery = {
                    q: "and(" + andQuery.join(',') + ")"
                };
                if (oldQuery != $scope.resultQuery.q || $scope.recentlyFetchedTestrun) {
                    rest.all('results').getList($scope.resultQuery).then(function (results) {
                        $scope.results = [];
                        //$scope.results = results;
                        _.each(results, function (result) {
                            if (result.started) {
                                result.recorded = result.started;
                            }
                            if (result.graph) {
                                $scope.getGraphDataFromResult(result)
                            }
                            $scope.results.push(result);
                        });
                        $scope.recentlyFetchedTestrun = false;
                        if (!disablePolling) {
                            testrunTimeout = $timeout($scope.fetchTestrun, 5000);
                        }
                    });
                }
            } else {
                if (!disablePolling) {
                    testrunTimeout = $timeout($scope.fetchTestrun, 500);
                }
            }
        };

        $scope.manuallyPassed = function(resultId) {
            rest.one()
        };

        $scope.getDisplayName = function (testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.toggleFilter = function (status) {
            $scope.filter[status] = !$scope.filter[status];
            $scope.statusFilter.$setDirty();
        };

        $scope.getTestrunDuration = function (testrun) {
            return getDurationString(testrun.runFinished - testrun.runStarted);
        };

        $scope.getResultDuration = function (result, raw) {
            if (result.runlength) {
                if (raw) {
                    return result.runlength;
                }
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                if (raw) {
                    return result.finished - result.started
                }
                return getDurationString(result.finished - result.started);
            }
        };

        $scope.$watch('statusFilter.$dirty', function (newValue, oldValue) {
            $scope.testrunQuery(true);
            $scope.statusFilter.$setPristine();
        });
        $scope.$watch('showFilter.$dirty', function (newValue, oldValue) {
            if (newValue) {
                $cookies.putObject('testrunShowFilter', $scope.show);
                $scope.showFilter.$setPristine();
            }
        });

        $scope.getAbbreviatedReason = function (result) {
            if (result.reason) {
                var line = result.reason.split("\n")[0];
                return line;
            } else {
                return "";
            }
        };

        $scope.getImages = function (result) {
            return _.filter(result.files, function (file) {
                return /^image/.test(file.mimetype);
            });
        };

        $scope.addMoreDetail = function (result, $event) {
            $scope.moreDetailForResult[result.id] = true;
        };

        $scope.removeDetail = function (result, $event) {
            $scope.moreDetailForResult[result.id] = false;
        };

        $scope.addNote = function (result, $event) {
            $scope.note.result = result;
            $scope.showAddNote = true;
        };

        $scope.addNoteDialogButtonClicked = function (buttonName) {
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
                rest.one('results', result.id).post('log', logEntry).then(function (numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
                if (note.recurring) {
                    rest.one('testcases', result.testcase.testcaseId).get().then(function (testcase) {
                        if (!testcase.activeNotes) {
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

        $scope.getResultNotes = function (result) {
            return _.filter(result.log, function (logEntry) {
                return (logEntry.level === "WARN" || logEntry.level === "INFO") && logEntry.loggerName === "slick.note";
            });
        };

        $scope.displayFile = function (file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            rest.one('files', file.id).one('content', file.filename).get().then(function (text) {
                if (text instanceof Object) {
                    $scope.fileToDisplay.text = JSON.stringify(text.plain(), null, 4);
                } else {
                    $scope.fileToDisplay.text = text
                }
            });
        };

        $scope.getFileViewer = function (file) {
            if (file && file.mimetype) {
                if (file.mimetype.indexOf("image") === 0) {
                    return "image";
                } else if (file.mimetype.indexOf("video") === 0) {
                    if (file.mimetype == "video/mp4") {
                        return "html5-video";
                    } else {
                        return "embed-video";
                    }
                } else {
                    return "text";
                }
            } else {
                return "text";
            }
        };

        $scope.showTestcase = function (result, $event) {
            $event.preventDefault();
            rest.one('testcases', result.testcase.testcaseId).get().then(function (testcase) {
                $scope.expandedResults[result.id] = $scope.expandedResults[result.id] ? !$scope.expandedResults[result.id] : true;
                $scope.testcase = testcase;
                $scope.testcases[testcase.name] = testcase
            });
        };

        $scope.getUrlForFile = function (file) {
            return "api/files/" + file.id + "/content/" + file.filename;
        };

        $scope.displayFileDialogButtonClicked = function (buttonName) {
            $scope.showDisplayFile = false;
            $scope.fileToDisplay = {};
        };

        $scope.displayReason = function (result, $event) {
            $event.preventDefault();
            $scope.showDisplayReason = true;
            $scope.reason = result.reason;
        };

        $scope.displayReasonDialogButtonClicked = function (buttonName) {
            $scope.showDisplayReason = false;
            $scope.reason = "";
        };

        $scope.displayLogs = function (result, $event) {
            $event.preventDefault();
            $scope.logs = result.log;
            $scope.showDisplayLogs = true;
        };

        $scope.displayLogsDialogButtonClicked = function (buttonName) {
            $scope.logs = [];
            $scope.showDisplayLogs = false;
        };

        $scope.displayTestcaseDialogButtonClicked = function (buttonName) {
            $scope.showTestcaseDialog = false;
            $scope.testcase = {
                name: "",
                purpose: ""
            };
        };

        $scope.onHistoryClick = function (history) {
            rest.one('results', history.resultId).get().then(function (result) {
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

        $scope.rescheduleStatus = function (status_name) {
            rest.one('testruns', $scope.testrun.id).one('reschedule', status_name).get();
        };

        $scope.rescheduleResult = function (result_id) {
            rest.one('results', result_id).one('reschedule').get();
        };
        $scope.markResultManuallyPassed = function (result) {
            result.log.push({entryTime: new Date().getTime(), level: "WARN", loggerName: "slick.note", message: "Manually Verified!", exceptionMessage: ""});
            rest.one('results', result.id).customPUT({status: "PASSED_ON_RETRY", runstatus: "FINISHED", log: result.log});
        };

        $scope.stopRefresh = function () {
            if (angular.isDefined(tpsTimeout)) {
                $interval.cancel(tpsTimeout);
                tpsTimeout = undefined;
            }
            if (angular.isDefined(testrunTimeout)) {
                $timeout.cancel(testrunTimeout);
                testrunTimeout = undefined;
            }
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

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
    })
    .directive('googleAreaChart', function () {
        return {
            restrict: 'E',
            transclude: false,
            template: '<div class="google-area-chart"></div>',
            replace: true,
            scope: {
                data: "=",
                options: "="
            },
            link: function postLink(scope, element, attrs) {
                var chart = new google.visualization.AreaChart(element[0]);

                function goToBuildReport() {
                    var selectedItem = chart.getSelection()[0];
                    if (selectedItem) {
                        var properties = scope.data.getRowProperties(selectedItem.row);
                        if (properties.project) {
                            window.location.href = ['build-report', properties.project, properties.release, properties.build].join('/')
                        } else if (properties.testrun) {
                            window.location.href = ['testruns', properties.testrun].join('/')
                        }
                    }
                }

                google.visualization.events.addListener(chart, 'error', function (googleError) {
                    google.visualization.errors.removeError(googleError.id);
                });

                google.visualization.events.addListener(chart, 'select', goToBuildReport);
                chart.draw(scope.data, scope.options);

                scope.$watch('data', function (newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
                scope.$watch('options', function (newValue, oldValue) {
                    chart.draw(scope.data, scope.options);
                });
            }
        }
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

        let focused = true;

        window.onfocus = function () {
            focused = true;
        };

        window.onblur = function () {
            focused = false;
        };

        $scope.getTestrunGroupData = function() {

            if (focused) {

                $scope.summaryChartOptions = {
                    chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
                    backgroundColor: "none",
                    pieSliceBorderColor: "none",
                    legend: 'none',
                    colors: []
                };

                $scope.individualChartOptions = {
                    chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
                    backgroundColor: "none",
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
                    backgroundColor: "none",
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
                    }
                    $scope.refreshPromise = $timeout($scope.getTestrunGroupData, 3000);
                });
            } else {
                $scope.refreshPromise = $timeout($scope.getTestrunGroupData, 500);
            }
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
    .controller('EditTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookies', function($scope, rest, nav, $routeParams, $cookies) {
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
            if ($cookies.get('slick-last-project-used')) {
                $scope.project = _.find(projects, function(project) {
                    return $cookies.get('slick-last-project-used') === project.name;
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
            backgroundColor: "none",
            pieSliceBorderColor: "none",
            legend: 'none',
            colors: []
        };

        $scope.individualChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
            backgroundColor: "none",
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
            backgroundColor: "none",
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
                    var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                    $scope.serialChartOptions.colors.push(color);
                    $scope.serialData.addColumn('number', replaceOnStatus(status, " "))
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
        try {
            $scope.environment = environment;
        } catch (e) {
            //    Don't log again but still catch.
        }

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;

        $scope.query = {
            order: 'dateCreated',
            limit: 25,
            page: 1
        };
        $scope.setOrder = function (order) {
            $scope.query.order = order;
        };
        $scope.limitOptions = [25, 50, 100, 200];
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.editbutton = {
            href: "result-list/" + $routeParams['project'] + "/" + $routeParams['release'] + "/" + $routeParams['build'],
            name: "Broken and Failed Results"
        };
        $scope.releaseReportButton = {
            href: "release-report/" + $routeParams['project'] + "/" + $routeParams['release'],
            name: "Release Report"
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

        let focused = true;

        window.onfocus = function () {
            focused = true;
        };

        window.onblur = function () {
            focused = false;
        };

        $scope.getBuildReportData = function () {
            if (focused) {
                if ($routeParams.release === 'latest') {
                    rest.all('testruns').getList({orderby: '-runStarted', limit: 5, 'project.name': $routeParams['project']}).then(function (testruns) {
                        let goldenTestrun = _.find(testruns, function (testrun) {
                            return angular.isDefined(testrun.build.name)
                        });
                        if (angular.isDefined(goldenTestrun)) {
                            $routeParams.release = goldenTestrun.release.name;
                            $routeParams.build = goldenTestrun.build.name;
                        } else {
                            rest.one('projects', $routeParams['project']).get().then(function (project) {
                                let lastRelease = project.releases.length - 1;
                                $routeParams.release = project.releases[lastRelease]['name'];
                                let lastBuild = project.releases[lastRelease]['builds'].length - 1;
                                $routeParams.build = project.releases[lastRelease]['builds'][lastBuild]['name']
                            });
                        }
                    });
                } else if ($routeParams.build === 'latest') {
                    rest.all('testruns').getList({orderby: '-runStarted', limit: 5, 'project.name': $routeParams['project'], 'release.name': $routeParams.release}).then(function (testruns) {
                        let goldenTestrun = _.find(testruns, function (testrun) {
                            return angular.isDefined(testrun.build.name)
                        });
                        if (angular.isDefined(goldenTestrun)) {
                            $routeParams.release = goldenTestrun.release.name;
                            $routeParams.build = goldenTestrun.build.name;
                        } else {
                            rest.one('projects', $routeParams['project']).get().then(function (project) {
                                let release = null;
                                for (let i = 0; i < project.releases.length; i++) {
                                    if (project.releases[i]['name'] === $routeParams.release) {
                                        release = project.releases[i];
                                        break;
                                    }
                                }
                                if (release !== null) {
                                    let lastBuild = project.releases[i]['builds'].length - 1;
                                    $routeParams.build = release['builds'][lastBuild]['name']
                                }
                            });
                        }
                    });
                }
                rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).get().then(function (buildreport) {
                    $scope.summaryChartOptions = {
                        chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
                        backgroundColor: "none",
                        pieSliceBorderColor: "none",
                        legend: 'none',
                        colors: []
                    };

                    $scope.individualChartOptions = {
                        chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
                        backgroundColor: "none",
                        isStacked: true,
                        legend: 'none',
                        hAxis: {
                            textStyle: {
                                color: '#c0c0c0'
                            },
                            slantedText: true
                        },
                        colors: []
                    };
                    $scope.routeParams = $routeParams;
                    $scope.testrungroup = buildreport;
                    $scope.estimatedTimeRemaining = "";
                    $scope.buildRunTime = "";
                    $scope.testRunsTitle = "Testruns";
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
                            var row = [testrun.name];
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
            } else {
                refresh_promise = $timeout($scope.getBuildReportData, 500);
            }
        };

        $scope.buildHistory = [];

        $scope.releaseReportOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "none",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };

        let params = {limit: "15", groupType: "PARALLEL"};
        if ($routeParams["limit"]) {
            params.limit = $routeParams["limit"];
        }

        $scope.releaseData = new google.visualization.DataTable();
        $scope.releaseData.addColumn('string', 'Build Name');
        $scope.getReleaseData = function () {
            if (focused) {
                rest.one('release-report', $routeParams.project).one($routeParams.release).get(params).then(function (releaseReport) {
                    $scope.releaseReportOptions = {
                        chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                        backgroundColor: "none",
                        vAxis: {
                            minValue: 0,
                            maxValue: 100,
                            format: '#\'%\''
                        },
                        lineWidth: 5,
                        legend: {
                            textStyle: {
                                color: "#ffffff"
                            }
                        },
                        colors: []
                    };
                    if (releaseReport.hasOwnProperty('name')) {
                        $scope.buildHistory = [];
                        $scope.releaseData = new google.visualization.DataTable();
                        $scope.releaseData.addColumn('date', 'Recorded');
                        let gotXAndY = false;
                        refresh_promise = $timeout($scope.getReleaseData, 3000);
                        _.each(releaseReport.builds.sort(function (a, b) {
                            return (a.testruns[0].dateCreated > b.testruns[0].dateCreated) ? 1 : ((b.testruns[0].dateCreated > a.testruns[0].dateCreated) ? -1 : 0);
                        }), function (build, index) {
                            $scope.buildHistory.unshift(build);
                            let row = [new Date(build.testruns[0].dateCreated)];
                            let sum = Object.values(build.groupSummary.resultsByStatus).reduce((a, b) => a + b, 0);
                            if (!gotXAndY) {
                                _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                    let color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                                    $scope.releaseReportOptions.colors.push(color);
                                    $scope.releaseData.addColumn('number', replaceOnStatus(status, " "));
                                });
                                gotXAndY = true;
                                // $scope.releaseData.addColumn('string', 'Build');
                            }
                            _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                row.push(build.groupSummary.resultsByStatus[status] / sum * 100);
                            });
                            // row.push(`${build.testruns[0].project.name}/${build.testruns[0].release.name}/${build.testruns[0].build.name}`);
                            $scope.releaseData.addRow(row);
                            $scope.releaseData.setRowProperties(index, {project: build.testruns[0].project.name, release: build.testruns[0].release.name, build: build.testruns[0].build.name})
                        });
                    } else {
                        refresh_promise = $timeout($scope.getReleaseData, 500);
                    }
                }, function errorCallback() {
                    refresh_promise = $timeout($scope.getReleaseData, 3000);
                },);
            } else {
                refresh_promise = $timeout($scope.getReleaseData, 500);
            }
        };

        $scope.getBuildReportData();

        $scope.getReleaseData();

        $scope.getResults = function (state) {
            var oldQuery = $scope.resultQuery.q;
            var includableStatuses = _.filter(_.keys($scope.filter), function (key) {
                return $scope.filter[key] && key !== 'withoutnotes'
            });
            var andQuery = ["eq(testrun__testrunId,\"" + $routeParams["testrunid"] + "\")"];
            if (includableStatuses.length === 1) {
                andQuery.push("eq(status,\"" + includableStatuses[0] + "\")")
            } else if (includableStatuses.length > 1) {
                var statuses = [];
                _.each(includableStatuses, function (status) {
                    statuses.push("eq(status,\"" + status + "\")");
                });
                andQuery.push("or(" + statuses.join(',') + ")")
            }
            if ($scope.filter['withoutnotes']) {
                andQuery.push('ne(log__loggerName,"slick.note")')
            }
            $scope.resultQuery = {
                q: "and(" + andQuery.join(',') + ")"
            };
            if (oldQuery != $scope.resultQuery.q || $scope.recentlyFetchedTestrun) {
                rest.all('results').getList($scope.resultQuery).then(function (results) {
                    $scope.results = [];
                    //$scope.results = results;
                    _.each(results, function (result) {
                        if (result.started) {
                            result.recorded = result.started;
                        }
                        $scope.results.push(result);
                    });
                    $scope.recentlyFetchedTestrun = false;
                    if (state !== "FINISHED") {
                        $timeout($scope.fetchTestrun, 5000);
                    }
                });
            }
        };

        $scope.cancelResultsForBuild = function (testrungroupId) {
            if (testrungroupId) {
                rest.one('testrungroups', testrungroupId).one('cancel').get();
            } else {
                rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).one('cancel').get();
            }
        };

        $scope.rescheduleStatusForBuild = function (status_name) {
            rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).one('reschedule', status_name).get();
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.stopRefresh = function () {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
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
            backgroundColor: "none",
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
                    backgroundColor: "none",
                    legend: {
                        textStyle: {
                            color: "#ffffff"
                        }
                    },
                    vAxis: {
                        minValue: 0,
                        maxValue: 100,
                        format: '#\'%\''
                    },
                    lineWidth: 5,
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
                    _.each(testrungroup.testruns, function (testrun, index) {
                        var row = [new Date(testrun.dateCreated)];
                        let sum = Object.values(testrun.summary.resultsByStatus).reduce((a, b) => a + b, 0);
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status] / sum * 100);
                        });
                        $scope.serialData.addRow(row);
                        $scope.serialData.setRowProperties(index, {testrun: testrun.id});
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
    .controller('EmailSubscriptionCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$location', '$cookies', function($scope, rest, nav, $routeParams, $location, $cookies) {
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
        if ($cookies.get('slick-last-project-used')) {
            $scope.selectedProjectName =  $cookies.get('slick-last-project-used');
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
        $scope.expandedResults = {};

        $scope.isExpanded = function (testcaseId) {
            return !!$scope.expandedResults[testcaseId];
        };
        $scope.testcases = {}

        $scope.results = [];
        $scope.filter = {};
        $scope.resultQuery = {};
        $scope.resultList = {};
        $scope.moreDetailForResult = {};
        $scope.moreDetail = false;
        $scope.showAddNote = false;
        $scope.statusToIcon = function(status) {
            switch(status) {
                case 'PASS':
                    return 'check_circle';
                case 'PASSED_ON_RETRY':
                    return 'check_circle';
                case 'FAIL':
                    return 'cancel';
                case 'BROKEN_TEST':
                    return 'error';
                case 'NO_RESULT':
                    return 'help';
                case 'SKIPPED':
                    return 'watch_later';
                case 'NOT_TESTED':
                    return 'pause_circle_filled';
            }
        };
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


        $scope.getResultDuration = function(result, raw) {
            if (result.runlength) {
                if (raw) {
                    return result.runlength
                }
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                if (raw) {
                    return result.finished - result.started
                }
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
                return (logEntry.level === "WARN" || logEntry.level === "INFO") && logEntry.loggerName === "slick.note";
            });
        };

        $scope.displayFile = function (file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            rest.one('files', file.id).one('content', file.filename).get().then(function (text) {
                if (text instanceof Object) {
                    $scope.fileToDisplay.text = JSON.stringify(text.plain(), null, 4);
                } else {
                    $scope.fileToDisplay.text = text
                }
            });
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
                } else {
                    return "text";
                }
            } else {
                return "text";
            }
        };

        $scope.showTestcase = function (testcaseId, $event) {
                        $event.preventDefault();
            rest.one('testcases', testcaseId).get().then(function (testcase) {
                $scope.expandedResults[testcase.name] = $scope.expandedResults[testcase.name] ? !$scope.expandedResults[testcase.name] : true;
                $scope.testcase = testcase;
                $scope.testcases[testcase.name] = testcase
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


const environment = {
    iframeConfig: [
        {
            icon: "video_label",
            title: "SmartLab",
            url: "https://manager.smartlab.vivint.com",
            width: "100%",
            height: "100%"
        },
        {
            icon: "lock_open",
            title: "Unlock Panel",
            url: "https://unlock.vivint.com",
            width: "100%",
            height: "100%"
        },

    ],
};

/**
 * User: steve.jensen
 * Date: 9/18/2018
 * Time: 4:14 PM
 */


angular.module("slickApp")
    .directive("pipeline", function () {
        return {
            restrict: 'E',
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/pipeline/pipeline.html",
            scope: {
                data: "=",
                size: "@"
            },

            link: function (scope, element, attrs, ctrls) {
                scope.replaceOnStatus = replaceOnStatus;
                scope.statusToColor = statusToColor;
                scope.phaseTypeToIcon = phaseTypeToIcon;
                scope.getDurationString = getDurationString;
                scope.setStats = function () {

                    scope.phases = [];
                    _.each(scope.data.phases, function (phase) {
                        phase.width = ((phase.duration / scope.data.duration) * 100).toFixed(0);
                        scope.phases.push(phase);
                    });
                };
                scope.setStats();
                scope.$watch('data', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.setStats();
                    }
                });
            }
        }
    });
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
'use strict';

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/build-diff/:project', {
                templateUrl: 'static/resources/pages/build-diff/build-diff.html',
                controller: 'BuildDiffCtrl',
                reloadOnSearch: false
            })
    }])
    .controller('BuildDiffCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location) {
        nav.setTitle("Compare Builds");

        if ($routeParams["project"]) {
            $scope.project = $routeParams["project"];
        }
        
        $scope.currentTimeMillis = new Date().getTime();

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;
        $scope.getDurationString = getDurationString;
        $scope.isObject = isObject;
        $scope.objToValues = objectToValues;
        $scope.objToKeys = objectToKeys;

        $scope.releasesForComparison1 = [];
        $scope.releasesSearchTerm1 = "";
        $scope.buildsForComparison1 = [];
        $scope.buildsSearchTerm1 = "";
        $scope.releaseForComparison1 = "";
        $scope.buildForComparison1 = "";
        $scope.resultsForComparison1 = undefined;

        $scope.releasesForComparison2 = [];
        $scope.releasesSearchTerm2 = "";
        $scope.buildsForComparison2 = [];
        $scope.buildsSearchTerm2 = "";
        $scope.releaseForComparison2 = "";
        $scope.buildForComparison2 = "";
        $scope.resultsForComparison2 = undefined;

        $scope.resultDifferences = undefined;

        $scope.navigateTo = function (uri) {
            window.open($location.$$absUrl.replace($location.$$url, uri), '_blank');
        };

        $scope.getReleasesForComparison = function(project_name, whichSide) {
            if (whichSide === undefined) {
                $scope.releasesForComparison1 = [];
                $scope.releasesForComparison2 = [];
                $scope.buildReport1 = undefined;
                $scope.buildReport2 = undefined;
                $scope.resultsForComparison1 = undefined;
                $scope.resultsForComparison2 = undefined;
            } else {
                $scope[`releasesForComparison${whichSide}`] = []
            }
            return rest.one('projects', project_name).one('releases').get().then(function (releases) {
                if (whichSide === undefined) {
                    $scope.releasesForComparison1 = releases.reverse();
                    $scope.releasesForComparison2 = $scope.releasesForComparison1;
                } else {
                    $scope[`releasesForComparison${whichSide}`] = releases.reverse()
                }
            })
        };

        $scope.getBuildsForComparison = function (project_name, release_name, whichSide) {
            if (whichSide === undefined) {
                $scope.buildsForComparison1 = [];
                $scope.buildsForComparison2 = [];
                $scope.resultsForComparison1 = undefined;
                $scope.resultsForComparison2 = undefined;
                $scope.resultDifferences = undefined;
            } else {
                $scope[`buildsForComparison${whichSide}`] = []
            }
            if (release_name != "") {
                return rest.one('projects', project_name).one('releases', release_name).one('builds').get().then(function (builds) {
                    if (whichSide === undefined) {
                        $scope.buildsForComparison1 = builds.reverse();
                        $scope.buildsForComparison2 = $scope.buildsForComparison1;
                    } else {
                        $scope[`buildsForComparison${whichSide}`] = builds.reverse()
                    }
                })
            }
        };

        $scope.buildReport1 = undefined;
        $scope.buildReport2 = undefined;

        function passed(result) {
            return result.status === "PASS" || result.status === "PASSED_ON_RETRY"
        }

        function notPassed(result) {
            return result.status !== "PASS" && result.status !== "PASSED_ON_RETRY"
        }

        $scope.verdictGoodOrBad = undefined;

        $scope.getVerdict = function (percent) {
            if (percent > 100) {
                $scope.verdictGoodOrBad = "good";
                return `${(percent - 100).toFixed(2)}% better!`;
            }
            else if(percent === 100) {
                $scope.verdictGoodOrBad = "";
                return "No Change!";
            } else {
                $scope.verdictGoodOrBad = "bad";
                return `${((percent - 100) * -1).toFixed(2)}% worse!`;
            }
        };

        $scope.getMetricVerdict = function (percent, metric, measurement) {
            if (percent > 0) {
                $scope.metrics[metric][measurement]['verdict'] = "bad";
                return `${percent.toFixed(2)} ${$scope.metrics[metric][measurement].unit} worse!`;
            }
            else if(percent === 0) {
                $scope.metrics[metric][measurement]['verdict'] = "";
                return "No Change!";
            } else {
                $scope.metrics[metric][measurement]['verdict'] = "good";
                return `${percent.toFixed(2) * -1} ${$scope.metrics[metric][measurement].unit} better!`;
            }
        };

        $scope.getPassedFromBuildReport = function(buildReport) {
            let passed = 0;
            if (buildReport.groupSummary.resultsByStatus.PASS) {
                passed = passed + buildReport.groupSummary.resultsByStatus.PASS;
            }
            if (buildReport.groupSummary.resultsByStatus.PASSED_ON_RETRY) {
                passed = passed + buildReport.groupSummary.resultsByStatus.PASSED_ON_RETRY

            }
            return passed;
        };

        $scope.gettingReport = false;
        $scope.getComparisonBuildReports = function(project_name, release1, build1, release2, build2) {
            $scope.gettingReport = true;
            $location.search("release1", release1.name);
            $location.search("build1", build1.name);
            $location.search("release2", release2.name);
            $location.search("build2", build2.name);
            $scope.buildReport1 = undefined;
            $scope.buildReport2 = undefined;
            $scope.resultDifferences = undefined;
            $scope.metrics = {};
            rest.one('build-report', project_name).one(release1.name, build1.name).get().then(function (buildReport1) {
                $scope.buildReport1 = buildReport1;
                if ($scope.buildReport1.metrics.length > 0) {
                    _.each($scope.buildReport1.metrics, function(metric) {
                        _.each(metric.measurements, function(measurement) {
                            if (!$scope.metrics[metric.name]) {
                                $scope.metrics[metric.name] = {}
                            }
                            if (!$scope.metrics[metric.name][measurement.name]) {
                                $scope.metrics[metric.name][measurement.name] = {}
                                $scope.metrics[metric.name][measurement.name].unit = metric.unit
                            }
                            measurement.value = parseFloat(measurement.value)
                            $scope.metrics[metric.name][measurement.name]['build1'] = measurement
                        })
                    })
                }
            });
            rest.one('build-report', project_name).one(release2.name, build2.name).get().then(function (buildReport2) {
                $scope.buildReport2 = buildReport2;
                if ($scope.buildReport2.metrics.length > 0) {
                    _.each($scope.buildReport2.metrics, function(metric) {
                        _.each(metric.measurements, function(measurement) {
                            if (!$scope.metrics[metric.name]) {
                                $scope.metrics[metric.name] = {}
                            }
                            if (!$scope.metrics[metric.name][measurement.name]) {
                                $scope.metrics[metric.name][measurement.name] = {}
                                $scope.metrics[metric.name][measurement.name].unit = metric.unit
                            }
                            measurement.value = parseFloat(measurement.value)
                            $scope.metrics[metric.name][measurement.name]['build2'] = measurement
                        })
                    })
                }
            });
            rest.all('results').getList({q: 'and(eq(project.name,"' + project_name + '"),' + 'eq(release.releaseId,"' + release1.id + '"),eq(build.buildId,"' + build1.id + '"),or(eq(status,"PASS"),eq(status,"PASSED_ON_RETRY"),eq(status,"FAIL"),eq(status,"BROKEN_TEST"),eq(status,"NOT_TESTED"),eq(status,"SKIPPED"),eq(status,"NO_RESULT")))'}).then(function(results1) {
                rest.all('results').getList({q: 'and(eq(project.name,"' + project_name + '"),' + 'eq(release.releaseId,"' + release2.id + '"),eq(build.buildId,"' + build2.id + '"),or(eq(status,"PASS"),eq(status,"PASSED_ON_RETRY"),eq(status,"FAIL"),eq(status,"BROKEN_TEST"),eq(status,"NOT_TESTED"),eq(status,"SKIPPED"),eq(status,"NO_RESULT")))'}).then(function(results2) {
                    $scope.resultDifferences = {'newFailures': [], 'fixed': [], 'existing': [], 'added': [], 'removed': []};
                    _.each(results1, function(result1) {
                        let found = false;
                        _.each(results2, function(result2) {
                            if (result1.testcase.testcaseId === result2.testcase.testcaseId) {
                                found = true;
                                if (passed(result1) && notPassed(result2)) {
                                    $scope.resultDifferences.newFailures.push({'result1': result1, 'result2': result2})
                                } else if (notPassed(result1) && passed(result2)) {
                                    $scope.resultDifferences.fixed.push({'result1': result1, 'result2': result2})
                                } else if (notPassed(result1) && notPassed(result2)) {
                                    $scope.resultDifferences.existing.push({'result1': result1, 'result2': result2})
                                }
                            }
                        });
                        if (!found) {
                            $scope.resultDifferences.removed.push(result1);
                        }
                    });
                    _.each(results2, function(result2) {
                        let found = false;
                        _.each(results1, function (result1) {
                            if (result1.testcase.testcaseId === result2.testcase.testcaseId) {
                                found = true;
                            }
                        });
                        if (!found) {
                            $scope.resultDifferences.added.push(result2);
                        }
                    });
                    $scope.gettingReport = false;
                });

            });

        };

        let promises = [];

        $scope.getReleasesForComparison($scope.project).then(function() {
            if ($routeParams["release1"]) {
                $scope.releaseForComparison1 = $scope.releasesForComparison1.filter(function(x) {return x.name === $routeParams["release1"]})[0];
                promises.push($scope.getBuildsForComparison($scope.project, $scope.releaseForComparison1.name, "1").then(function() {
                    if ($routeParams["build1"]) {
                        $scope.buildForComparison1 = $scope.buildsForComparison1.filter(function(x) {return x.name === $routeParams["build1"]})[0]
                    }
                }))
            }
            if ($routeParams["release2"]) {
                $scope.releaseForComparison2 = $scope.releasesForComparison2.filter(function(x) {return x.name === $routeParams["release2"]})[0];
                promises.push($scope.getBuildsForComparison($scope.project, $scope.releaseForComparison2.name, "2").then(function() {
                    if ($routeParams["build2"]) {
                        $scope.buildForComparison2 = $scope.buildsForComparison2.filter(function(x) {return x.name === $routeParams["build2"]})[0]
                    }
                }))
            }
            if ($routeParams["release1"] && $routeParams["release2"] && $routeParams["build1"] && $routeParams["build2"]) {
                Promise.all(promises).then(function() {
                    $scope.getComparisonBuildReports($scope.project, $scope.releaseForComparison1, $scope.buildForComparison1, $scope.releaseForComparison2, $scope.buildForComparison2);
                });
            }
        });


        window.scope = $scope;
    }]);
