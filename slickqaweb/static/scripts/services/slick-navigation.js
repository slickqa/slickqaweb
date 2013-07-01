'use strict';
/**
 * User: jcorbett
 * Date: 5/30/13
 * Time: 1:27 PM
 */

// nav.group('Products').add('A Product', 'products/A+Product', 100)

angular.module('slickServicesModule')
  .provider('NavigationService', function() {
      var _show = false;
      var _mode = "overlay";
      var _nav = [
          {name: "Bookmarks",
           show: true,
           icon: "images/bookmarks.png",
           links: [
           ]},
          {name: "Settings",
           show: false,
           icon: "images/settings.png",
           links: [
           ]},
          {name: "Dashboards",
           show: false,
           icon: "images/dashboards.png",
           links: [
           ]},
          {name: "Project Management",
           show: false,
           icon: "images/project.png",
           links: [
           ]},
          {name: "Test Management",
           show: false,
           icon: "images/testmgmt.png",
           links: [
           ]},
          {name: "Run Tests",
           show: false,
           icon: "images/runtests.png",
           links: [
           ]},
          {name: "Reports",
           show: false,
           icon: "images/reports.png",
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

          if(showByDefault == null) {
              showByDefault = false
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

      this.$get = function() {
        window.nav = {
            NOICON: "NO ICON",

            show: function() {
                return _show;
            },

            mode: function() {
                return _mode;
            },

            toggleShow: function() {
                if(_show && _mode != "pinned") {
                    _show = false;
                } else {
                    _show = true;
                }
            },

            toggleMode: function() {
                if(_mode == "overlay") {
                    _mode = "pinned";
                } else {
                    _mode = "overlay";
                }
            },

            sections: function() {
                return _nav;
            },

            getSection: getSection,
            addSection: addSection,
            addLink: addLink
        };
        return window.nav;
      };
    });