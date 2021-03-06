describe("AppActivityHandler test", function() {
    // localStorage.AppActivityHandlerDebug = 1;

    var clock;
    var appActivityHandler;
    var origHasFocus;
    beforeEach(function () {
        clock = sinon.useFakeTimers("Date", "setTimeout", "clearTimeout");
        origHasFocus = document.hasFocus;
        document.hasFocus = function() { return true; };
        appActivityHandler = new AppActivityHandler();
    });

    afterEach(function () {
        clock.restore();
        appActivityHandler.destroy();
        document.hasFocus = origHasFocus;
    });

    it("Initial setup", function() {
        appActivityHandler.addSubscriber("test1", function(isActive) {});
        expect(appActivityHandler.hasSubscriber("test1")).to.eql(true);
    });
    it("Initial => Inactivity => Activity", function() {
        expect(appActivityHandler.isActive).to.eql(true);

        var events = [];
        appActivityHandler.addSubscriber("test1", function(isActive) {
            events.push(isActive);
        });

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[]");

        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT + 100);
        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events)).to.eql("[false]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[false,true]");
    });

    it("Initial => Inactivity => Activity => Activity => Inactivity", function() {
        expect(appActivityHandler.isActive).to.eql(true);

        var events = [];
        appActivityHandler.addSubscriber("test1", function(isActive) {
            events.push(isActive);
        });

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[]");

        // initial => inactive
        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT + 1);
        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events)).to.eql("[false]");

        // initial => inactive => active
        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[false,true]");

        // initial => inactive => STILL active
        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT/2);
        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[false,true]");

        // initial => inactive => active => inactive
        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT + 1);
        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events)).to.eql("[false,true,false]");

        // initial => inactive => active => inactive => active
        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events)).to.eql("[false,true,false,true]");
    });

    it("2 registered subscribers - Initial => Inactivity => Activity", function() {
        expect(appActivityHandler.isActive).to.eql(true);

        var events1 = [];
        appActivityHandler.addSubscriber("test1", function(isActive) {
            events1.push(isActive);
        });
        var events2 = [];
        appActivityHandler.addSubscriber("test2", function(isActive) {
            events2.push(isActive);
        });

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[]");
        expect(JSON.stringify(events2)).to.eql("[]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[]");
        expect(JSON.stringify(events2)).to.eql("[]");

        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT + 100);
        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events1)).to.eql("[false]");
        expect(JSON.stringify(events2)).to.eql("[false]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[false,true]");
        expect(JSON.stringify(events2)).to.eql("[false,true]");
    });
    it("add => remove subscribers - Initial => Inactivity => Activity", function() {
        expect(appActivityHandler.isActive).to.eql(true);

        var events1 = [];
        appActivityHandler.addSubscriber("test1", function(isActive) {
            events1.push(isActive);
        });
        var events2 = [];
        appActivityHandler.addSubscriber("test2", function(isActive) {
            events2.push(isActive);
        });
        // remove after adding, so that we can later assert on events2 if this subscriber was actually called or not
        appActivityHandler.removeSubscriber("test2");

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[]");
        expect(JSON.stringify(events2)).to.eql("[]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[]");
        expect(JSON.stringify(events2)).to.eql("[]");

        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_ACTIVITY_TIMEOUT + 100);
        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events1)).to.eql("[false]");
        expect(JSON.stringify(events2)).to.eql("[]");

        $(window).trigger('mousemove');

        expect(appActivityHandler.isActive).to.eql(true);
        expect(JSON.stringify(events1)).to.eql("[false,true]");
        expect(JSON.stringify(events2)).to.eql("[]");
    });

    it("add => remove subscribers - Initial no focus => Focus => Blur", function(done) {
        document.hasFocus = function() { return false; };

        appActivityHandler = new AppActivityHandler();

        expect(appActivityHandler.isActive).to.eql(false);

        var events1 = [];
        appActivityHandler.addSubscriber("test1", function(isActive) {
            events1.push(isActive);
        });
        var events2 = [];
        appActivityHandler.addSubscriber("test2", function(isActive) {
            events2.push(isActive);
        });
        // remove after adding, so that we can later assert on events2 if this subscriber was actually called or not
        appActivityHandler.removeSubscriber("test2");

        expect(appActivityHandler.isActive).to.eql(false);
        expect(JSON.stringify(events1)).to.eql("[]");
        expect(JSON.stringify(events2)).to.eql("[]");

        $(window).triggerHandler('focus');

        setTimeout(function() {
            expect(appActivityHandler.isActive).to.eql(true);
            expect(JSON.stringify(events1)).to.eql("[true]");
            expect(JSON.stringify(events2)).to.eql("[]");

            $(window).triggerHandler('blur');

            clock.tick(AppActivityHandler.APPACTIVITYHANDLER_BLUR_FOCUS_THROTTLING + 5);
            expect(appActivityHandler.isActive).to.eql(false);
            expect(JSON.stringify(events1)).to.eql("[true,false]");
            expect(JSON.stringify(events2)).to.eql("[]");

            $(window).triggerHandler('focus');

            clock.tick(AppActivityHandler.APPACTIVITYHANDLER_BLUR_FOCUS_THROTTLING + 5);

            expect(appActivityHandler.isActive).to.eql(true);
            expect(JSON.stringify(events1)).to.eql("[true,false,true]");
            expect(JSON.stringify(events2)).to.eql("[]");
            done();
        }, AppActivityHandler.APPACTIVITYHANDLER_BLUR_FOCUS_THROTTLING + 5);
        clock.tick(AppActivityHandler.APPACTIVITYHANDLER_BLUR_FOCUS_THROTTLING + 5);

    });
});
