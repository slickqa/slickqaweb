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
