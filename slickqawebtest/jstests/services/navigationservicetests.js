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

    beforeEach(angular.mock.module('slickServicesModule', function($provide) {
        $provide.value('$cookieStore', cookiestore);
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
