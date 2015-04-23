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
                        if(!$scope.testplansByProjectId[testplan.project.id]) {
                            $scope.testplansByProjectId[testplan.project.id] = []
                        }
                        $scope.testplansByProjectId[testplan.project.id].push(testplan);
                        $scope.testplansById[testplan.id] = testplan;
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
