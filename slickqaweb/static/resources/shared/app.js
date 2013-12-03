'use strict';

angular.module('slickApp', ['ngAnimate', 'ngRoute', 'ngResource', 'ngCookies', 'restangular', 'ngSanitize'])
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

function getDurationString(duration) {
    var seconds = duration / 1000.0;
    var minutes = 0;
    var hours = 0;
    var days = 0;
    var retval = "";

    if (seconds > 60) {
        minutes = Math.floor(seconds / 60);
        seconds = (seconds % 60).toFixed(3) + " seconds"
    } else {
        seconds = seconds.toFixed(3) + " seconds";
    }

    if (minutes > 60) {
        hours = minutes / 60;
        minutes = (minutes % 60) + " minutes ";
    } else if (minutes > 0) {
        minutes = minutes + " minutes ";
    }

    if (hours > 24) {
        days = hours / 24;
        hours = (hours % 24) + " hours ";
    } else if (hours > 0) {
        hours = hours + " hours ";
    }

    if (days > 0) {
        retval = days + " days ";
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
}