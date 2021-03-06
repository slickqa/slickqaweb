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
    });