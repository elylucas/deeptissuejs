;

(function (window, undefined) {

    "use strict";

    var deeptissue = function (node, customSettings) {

        return new deeptissue.fn.init(node, customSettings);
    };

    deeptissue.fn = deeptissue.prototype = {

        constructor: deeptissue,

        init: function (node, customSettings) {

            var that = this;

            if (!node) {
                return node;
            }

            if("length" in node){  //rude detection for nodeList
                this.node = node;                
            }else{
                this.node = [node];
            }

            this.settings = this.extend({}, this.settings, customSettings);
            this.buildVendorNames();

            this.touchType = window.navigator.msPointerEnabled ? "pointer" :
                                "ontouchstart" in window ? "touch" : "mouse";

            this.hasMouse = ("ontouchstart" in window && "onmousedown" in window);

            this.touchStart = this.touchType === "pointer" ? "MSPointerDown" :
                            this.touchType === "touch" ? "touchstart" : "mousedown";

            this.touchEnd = this.touchType === "pointer" ? "MSPointerUp" :
                            this.touchType === "touch" ? "touchend" : "mouseup";

            this.touchOut = this.touchType === "pointer" ? "MSPointerOut" :
                            this.touchType === "touch" ? "touchcancel" : "mouseout";

            this.touchMove = this.touchType === "pointer" ? "MSPointerMove" :
                            this.touchType === "touch" ? "touchmove" : "mousemove";

            this.touchCancel = this.touchType === "pointer" ? "MSPointerCancel" :
                            this.touchType === "touch" ? "touchcancel" : "mouseout";

            if (this.hasmsGesture) {
                this.setupMSGesture();
            }else{
                this.setUpTouchGestures();
                this.setupTouch();
            }

            return this;
        },
        
        version: "0.0.5",

        hasMouse: "",
        touchType: "",
        touchStart: "",
        touchEnd: "",
        touchOut: "",
        touchMove: "",
        touchCancel: "",
        hasmsGesture: (window.MSGesture),

        //right now these would be for iOS, maybe Android will step up someday
        setUpTouchGestures: function(){
            
            var that = this;

            try {

                [ ].forEach.call(this.node, function (el) {

                    el.addEventListener("gesturestart", function (evt) {

                        evt.preventDefault();

                    });


                    el.addEventListener("gesturechange", function (evt) {

                        that.gestureChange.call(that, evt);

                    });

                    el.gStartScale = 1.0;
                    el.gStartRotation = 0;

                });

            } catch (ex) {

                var tl = document.querySelector(".touch-log");

            tl.innerText = "setUpTouchGestures is broken \r\n" + tl.innerText;
                return false;
            }

        },

        setupMSGesture: function () {

            var that = this,
                settings = this.settings;

            try {

                [ ].forEach.call(this.node, function (el) {

                    var t = new MSGesture();

                    if (t) {

                        t.target = el;

                        el.addEventListener("MSPointerDown", function (evt) {

                            // adds the current mouse, pen, or touch contact for gesture recognition
                            t.addPointer(evt.pointerId);

                            that.setupSwipe(evt, el, settings);

                        });

                        el.addEventListener("MSGestureChange", function (evt) {
                            that.msGestureChange.call(that, evt);
                        });

                        ///Double Tap functionality
                        el.addEventListener("MSPointerDown", function (evt) {
                            that.doDoubleTap(evt, el, settings);
                        });

                    }

                });

            } catch (ex) {
                return false;
            }

        },

        swipeRightCallback: function () { },
        swipeLeftCallback: function () { },
        swipeUpCallback: function () { },
        swipeDownCallback: function () { },
        moveCallback: function () { },
        moveHorizontalCallback: function () { },
        moveVerticalCallback: function () { },
        rotateCallback: function () { },
        scaleCallback: function () { },
        tapCallback:  function () { },
        doubleTapCallback:  function () { },
        tapHoldCallback:  function () { },

        processGestureChange: function(e, m){

//            e.preventDefault();

            /*
                Note: Really need to figure out how to Handle FireFox and possible Opera because
                        it does not look like they support a CSSMatrix object.
            */

            var that = this,
                settings = this.settings,
                el = e.target;

            ////only for dev testing, remove
            //var tl = document.querySelector(".touch-log");

            //    tl.innerText = "rotating " +
            //                        e.rotation + "\n" +
            //                        el.innerText;


            if (el.hasAttribute(settings.rotateIndicator) && 
                Math.abs(e.rotation) > settings.rotateThreshold) {
                //probably going to remove this or make it an optional setting to trigger
                el.style.transform = m.rotate(e.rotation * 180 / Math.PI); // Apply Rotation

                this.rotateCallback(e, m);
            }

            if (el.hasAttribute(settings.scaleIndicator) && Math.abs(e.scale) > settings.scaleThreshold) {
                //probably going to remove this or make it an optional setting to trigger
                el.style.transform = m.scale(e.scale); // Apply Rotation
                this.scaleCallback(e, m);
            }

            if (el.hasAttribute(settings.moveIndicator) && 
                    (Math.abs(e.translationX) > settings.moveThreshold ||
                     Math.abs(e.translationY) > settings.moveThreshold)) {

                el.style.transform = m.translate(e.translationX, e.translationY, 0); // Apply Translation;
                this.moveCallback(e, m);
            }

            if (el.hasAttribute(settings.horizontalIndicator) && 
                    Math.abs(e.translationX) > settings.moveThreshold) {

                e.target.style.transform = m.translate(e.translationX, 0, 0); // Apply Translation;
                this.moveHorizontalCallback(e, m);
            }

            if (el.hasAttribute(settings.verticalIndicator) && 
                    Math.abs(e.translationY) > settings.moveThreshold) {
                e.target.style.transform = m.translate(0, e.translationY, 0); // Apply Translation;
                this.moveVerticalCallback(e, m);
            }

            if (el.hasAttribute(settings.swipeRight) && 
                    e.translationX > 0 && //need to add the threshold check here
                    e.translationX > settings.swipeRightThreshold){

                        console.log("should swipe right");
                        that.swipeRightCallback(e, m);

            }

            if (el.hasAttribute(settings.swipeLeft) &&
                    e.translationX < 0 &&
                    Math.abs(e.translationX) > settings.swipeLeftThreshold) {

                    console.log("should swipe left");
                    that.swipeLeftCallback(e, m);

              //      el.removeAttribute(settings.swipeLeft);
            }

            //I know the < 0 && > 0 seem counter intuitive, but that seems to be how it works
            if (el.hasAttribute(settings.swipeUp) && e.translationY < 0 &&
                    Math.abs(e.translationY) > settings.swipeUpThreshold) {

                    that.swipeUpCallback(e, m);

             //       el.removeAttribute(settings.swipeUp);
            }

            if (el.hasAttribute(settings.swipeDown) && e.translationY > 0 &&
                    e.translationY > settings.swipeDownThreshold) {

                    that.swipeDownCallback(e, m);
            //        el.removeAttribute(settings.swipeDown);
            }

            console.log(e.translationX + " - " + e.translationY);
            
        },

        gestureChange: function (e) {

                var el = e.target,
                    settings = this.settings;

                    e.preventDefault ();
                    //target.style.webkitTransform =
                    //    'scale(' + (target.gStartScale * e.scale) + ') ' +
                    //    'rotate(' + (target.gStartRotation + e.rotation) + 'deg)';

            var tl = document.querySelector(".touch-log");

            tl.innerText = "gesture Change \r\n" + 
                            el.hasAttribute(settings.rotateIndicator) + "\r\n" +
                            tl.innerText;


            if (el.hasAttribute(settings.rotateIndicator) && 
                Math.abs(e.rotation) > settings.rotateThreshold) {
                //probably going to remove this or make it an optional setting to trigger
                el.style.webkitTransform =
                        'rotate(' + (el.gStartRotation + e.rotation) + 'deg)';

                this.rotateCallback(e, m);
            }

            if (el.hasAttribute(settings.scaleIndicator) && 
                    Math.abs(e.scale) > settings.scaleThreshold) {
                //probably going to remove this or make it an optional setting to trigger
                el.style.webkitTransform =
                        'scale(' + (el.gStartScale * e.scale) + ') ';
                this.scaleCallback(e, m);
            }

        },

        msGestureChange: function (e) {

            if(window.MSCSSMatrix){
                this.processGestureChange(e, new MSCSSMatrix(e.target.style.transform));   
            }

        },

        calculateTranslation: function(start, end){
        
            return {
                translationX: end.x - start.x ,
                translationY: end.y - start.y
            };
        },

        setupIndicator: function(callback, callbackName, threshold, threshholdName, indicator){
            
            var that = this,
                settings = this.settings;

            if (callback !== undefined) {
                this[callbackName] = callback;
            }

            if (threshold) {
            //    threshold = this.settings[threshholdName] || 0;
            //} else {
                this.settings[threshholdName] = threshold;
            }

            [ ].forEach.call(this.node, function (el) {
                el.setAttribute(settings[indicator], "true");
            });

        },
        /*
        caluculateDistance: function (start, end) {
            return Math.round(Math.sqrt(Math.pow(end.x - start.x, 2) + 
                                Math.pow(end.y - start.y, 2)));
        },
        */
        /**
        * Calcualte the angle of the swipe
        */
        /*
        calculateAngle: function (start, end) {
            var X = start.x - end.x,
                Y = end.y - start.y,
                r = Math.atan2(Y, X), //radians
                angle = Math.round(r * 180 / Math.PI); //degrees

            //ensure value is positive
            if (angle < 0) {
                angle = 360 - Math.abs(angle);
            }

            return angle;
        },
        */
        /**
        * Calcualte the direction of the swipe
        * This will also call calculateAngle to get the latest angle of swipe
        */
        /*
        calculateDirection: function (start, end) {
            var angle = calculateAngle(start, end);

            if ((angle <= 45) && (angle >= 0))
                return LEFT;

            else if ((angle <= 360) && (angle >= 315))
                return LEFT;

            else if ((angle >= 135) && (angle <= 225))
                return RIGHT;

            else if ((angle > 45) && (angle < 135))
                return DOWN;

            else
                return UP;
        },
        */
        PreventDefaultManipulationAndMouseEvent: function (evtObj) {

            if (evtObj.preventDefault) {
                evtObj.preventDefault();
                return;
            }

            if (evtObj.preventManipulation) {
                evtObj.preventManipulation();
                return;
            }

            if (evtObj.preventMouseEvent) {
                evtObj.preventMouseEvent();
                return;
            }

        },

        getTouchPoints: function (e) {

            var that = this,
                touchPoints = (typeof e.changedTouches != 'undefined') ?
                                e.changedTouches : [e],
                touchPoint = touchPoints[touchPoints.length - 1],
                tp;

            if (that.touchType === "pointer"){
                tp = { x: touchPoint.x, y: touchPoint.y };
            }else if(that.touchType === "touch") {
                tp = { x: touchPoint.pageX, y: touchPoint.pageY };
            } else {//mouse
                tp = { x: e.pageX, y: e.pageY };
            }

            return tp;
        },

        node: undefined,

        //simple version of the jQuery function
        extend: function () {

            var target = arguments[0] || {},
                i = 1,
                src, prop,
                copy,
                options,
                length = arguments.length;

            for (; i < length; i++) {
                // Only deal with non-null/undefined values
                if ((options = arguments[i]) !== null) {
                    // Extend the base object
                    for (name in options) {
                        src = target[prop];
                        copy = options[prop];

                        // Prevent never-ending loop
                        if (target === copy) {
                            continue;
                        }

                        if (copy !== undefined) {
                            target[prop] = copy;
                        }
                    }
                }
            }

            return target;
        },

        div: undefined,
        support: {},

        buildVendorNames: function () {

            this.div = document.createElement('div');

            // Check for the browser's transitions support.
            this.support.transition = this.getVendorPropertyName('transition');
            this.support.transitionDelay = this.getVendorPropertyName('transitionDelay');
            this.support.transform = this.getVendorPropertyName('transform');
            this.support.transformOrigin = this.getVendorPropertyName('transformOrigin');
            this.support.transform3d = this.checkTransform3dSupport();

            // Avoid memory leak in IE.
            this.div = null;

        },

        getVendorPropertyName: function (prop) {
            var prefixes = ['Moz', 'Webkit', 'O', 'ms'],
                vendorProp, i,
                prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

            if (prop in this.div.style) {
                return prop;
            }

            for (i = 0; i < prefixes.length; ++i) {

                vendorProp = prefixes[i] + prop_;

                if (vendorProp in this.div.style) {
                    return vendorProp;
                }

            }
        },

        // Helper function to check if transform3D is supported.
        // Should return true for Webkits and Firefox 10+.
        checkTransform3dSupport: function () {
            this.div.style[this.support.transform] = '';
            this.div.style[this.support.transform] = 'rotateY(90deg)';
            return this.div.style[this.support.transform] !== '';
        },

        //DoubleTap Handler
        doDoubleTap: function(evt, el, settings){

            var that = this;
            
            if(el.hasAttribute(settings.doubleTapIndicator) &&
                    el.hasAttribute(settings.doubleTapStart)){

                    el.removeAttribute(settings.doubleTapStart);
                    clearTimeout(el.getAttribute(settings.doubleTapStart));
                    that.doubleTapCallback(evt);
                
            }
                        
            if(el.hasAttribute(settings.doubleTapIndicator) &&
                    !el.hasAttribute(settings.doubleTapStart)){

                    el.setAttribute(settings.doubleTapStart, 
                                setTimeout(function () {
                                    el.removeAttribute(settings.doubleTapStart);
                                    clearTimeout(el.getAttribute(settings.doubleTapStart));
                                }, settings.doubleTapThreshold));
                
            }

        },

        setupSwipe: function(evt, el, settings){

            var that = this;
            
            if(el.hasAttribute(settings.swipeRight)){
                
                el.removeAttribute(settings.swipeRightEnd);

                if (!el.hasAttribute(settings.swipeRightInit)) {

                    el.setAttribute(settings.swipeRightInit, 
                                JSON.stringify(that.getTouchPoints(evt)));

                }

            }

            if(el.hasAttribute(settings.swipeLeft)){
                
                el.removeAttribute(settings.swipeLeftEnd);

                if (!el.hasAttribute(settings.swipeLeftInit)) {

                    el.setAttribute(settings.swipeLeftInit, 
                                JSON.stringify(that.getTouchPoints(evt)));

                }

            }

            if(el.hasAttribute(settings.swipeUp)){
                
                el.removeAttribute(settings.swipeUpEnd);

                if (!el.hasAttribute(settings.swipeUpInit)) {

                    el.setAttribute(settings.swipeUpInit, 
                                JSON.stringify(that.getTouchPoints(evt)));

                }

            }

            if(el.hasAttribute(settings.swipeDown)){
                
                el.removeAttribute(settings.swipeDownEnd);

                if (!el.hasAttribute(settings.swipeDownInit)) {

                    el.setAttribute(settings.swipeDownInit, 
                                JSON.stringify(that.getTouchPoints(evt)));

                }

            }

        },

        //Touch event handlers
        setupTouch : function () {

            var that = this,
                settings = this.settings;

            [ ].forEach.call(this.node, function (el) {

                var moveHandler = function (evt) {
                    
                        evt.preventDefault();
                        that.touchMoveHandler.call(that, evt, el, settings);
                    },
                    endHandler = function (evt) {
                        
                        evt.preventDefault();
                        that.endTouchHandler.call(that, evt, el, settings);
                    },
                    startHandler = function (evt) {

                        evt.preventDefault();
                        that.startTouchHandler.call(that, evt, el, settings);
                    };

                el.addEventListener(that.touchStart, startHandler);
                el.addEventListener(that.touchMove, moveHandler);
                el.addEventListener(that.touchEnd, endHandler);

                if(that.hasMouse){
                    
                    el.addEventListener("mousedown", startHandler);
                    el.addEventListener("mousemove", moveHandler);
                    el.addEventListener("mouseup", endHandler);

                }

            });

        },

        startTouchHandler : function (evt, el, settings) {

            var that = this;
                settings = this.settings;

                evt.preventDefault();

                console.log("touch start");

            if (el.hasAttribute(settings.moveIndicator)) {

                el.removeAttribute(settings.moveTouchEnded);

                if (!el.hasAttribute(settings.moveTouchInitial)) {

                    el.setAttribute(settings.moveTouchInitial,
                                        JSON.stringify(that.getTouchPoints(evt)));
                }

            }

            if (el.hasAttribute(settings.horizontalIndicator)) {

                el.removeAttribute(settings.horizontalTouchEnd);

                if (!el.hasAttribute(settings.horizontalTouchInit)) {

                    el.setAttribute(settings.horizontalTouchInit, JSON.stringify(that.getTouchPoints(evt)));
                }

            }

            if (el.hasAttribute(settings.verticalIndicator)) {

                el.removeAttribute(settings.verticalTouchEnd);

                if (!el.hasAttribute(settings.verticalTouchInit)) {

                    el.setAttribute(settings.verticalTouchInit, JSON.stringify(that.getTouchPoints(evt)));
                }

            }

            that.setupSwipe(evt, el, settings);

            if(el.hasAttribute(settings.tapIndicator) &&
                    !el.hasAttribute(settings.tapStart)) {

                    el.setAttribute(settings.tapStart, 
                                setTimeout(function () {
                                    clearTimeout(el.getAttribute(settings.tapStart));
                                    el.removeAttribute(settings.doubleTapStart);
                                }, 700));

            }

            that.doDoubleTap(evt, el, settings);

        },

        endTouchHandler : function (evt, el, settings) {

            var that = this;
                settings = this.settings;

                evt.preventDefault();

            if (el.hasAttribute(settings.moveTouchInitial)) {
                el.setAttribute(settings.moveTouchEnded, "true");
                //el.removeAttribute(settings.moveTouchInitial);
            }

            if (el.hasAttribute(settings.horizontalIndicator)) {
                el.setAttribute(settings.horizontalTouchEnd, "true");
              //  el.removeAttribute(settings.horizontalTouchInit);
            }

            if (el.hasAttribute(settings.verticalIndicator)) {
                el.setAttribute(settings.verticalTouchEnd, "true");
             //   el.removeAttribute(settings.verticalTouchInit);
            }

            if(el.hasAttribute(settings.swipeRight)){
                el.setAttribute(settings.swipeRightEnd, "true");
            }

            if(el.hasAttribute(settings.swipeLeft)){
                el.setAttribute(settings.swipeLeftEnd, "true");
            }

            if(el.hasAttribute(settings.swipeUp)){
                el.setAttribute(settings.swipeUpEnd, "true");
            }

            if(el.hasAttribute(settings.swipeDown)){
                el.setAttribute(settings.swipeDownEnd, "true");
            }

            if(el.hasAttribute(settings.tapIndicator) &&
                el.hasAttribute(settings.tapStart)) {

                that.tapCallback(evt);
                clearTimeout(el.getAttribute(settings.tapStart));
                el.removeAttribute(settings.tapStart);

            }

        },

        touchMoveHandler : function (evt, el, settings) {

            var that = this;
                settings = this.settings;

                evt.preventDefault();

            if (el.hasAttribute(settings.moveIndicator)) {

                if (!el.hasAttribute(settings.moveTouchEnded) &&
                            el.hasAttribute(settings.moveTouchInitial)) {

                    start = JSON.parse(el.getAttribute(settings.moveTouchInitial)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    el.style[that.support.transform] = "translate3D(" + translate.translationX + "px, " +
                                                    translate.translationY + "px, 0)";

//                    console.log(that.support.transform + ": " + el.style[that.support.transform]);

                }

            }

            if (el.hasAttribute(settings.horizontalIndicator)) {

                if (!el.hasAttribute(settings.horizontalTouchEnd) &&
                                el.hasAttribute(settings.horizontalTouchInit)) {

                    console.log("should -horizontal move");

                    var start = JSON.parse(el.getAttribute(settings.horizontalTouchInit)),
                                    end = that.getTouchPoints(evt),
                                    translate = that.calculateTranslation(start, end);

                    if (Math.abs(translate.translationX) > that.settings.moveThreshold) {

                        el.style[that.support.transform] =
                                        "translate3D(" + translate.translationX + "px, 0, 0)";

                    }

                }

            }

            if (el.hasAttribute(settings.verticalIndicator)) {

                if (!el.hasAttribute(settings.verticalTouchEnd) &&
                            el.hasAttribute(settings.verticalTouchInit)) {

                    var start = JSON.parse(el.getAttribute(settings.verticalTouchInit)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    if(Math.abs(translate.translationY) > that.settings.moveThreshold){

                        el.style[that.support.transform] = 
                                    "translate3D(0, " + translate.translationY + "px, 0)";

                    }

                }

            }

            if(el.hasAttribute(settings.swipeRight)){
                
                if (!el.hasAttribute(settings.swipeRightEnd) &&
                            el.hasAttribute(settings.swipeRightInit)) {

                    console.log("should swipe right");

                    var start = JSON.parse(el.getAttribute(settings.swipeRightInit)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    if(translate.translationX > 0 && 
                        Math.abs(translate.translationX) > settings.swipeRightThreshold){

                        that.swipeRightCallback(evt, null, translate);

                        el.setAttribute(settings.swipeLeftInit, JSON.stringify(that.getTouchPoints(evt)));
                        el.setAttribute(settings.swipeRightInit, JSON.stringify(that.getTouchPoints(evt)));
                    }

                }

            }

            if(el.hasAttribute(settings.swipeLeft)){
                
                if (!el.hasAttribute(settings.swipeLeftEnd) &&
                            el.hasAttribute(settings.swipeLeftInit)) {

                    console.log("should swipe left");

                    var start = JSON.parse(el.getAttribute(settings.swipeLeftInit)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    if(translate.translationX < 0 && 
                        Math.abs(translate.translationX) > settings.swipeLeftThreshold){

                        that.swipeLeftCallback(evt, null, translate);

                        el.setAttribute(settings.swipeLeftInit, JSON.stringify(that.getTouchPoints(evt)));
                        el.setAttribute(settings.swipeRightInit, JSON.stringify(that.getTouchPoints(evt)));

                    }

                }

            }

            if(el.hasAttribute(settings.swipeUp)){
                
                if (!el.hasAttribute(settings.swipeUpEnd) &&
                            el.hasAttribute(settings.swipeUpInit)) {

                    console.log("should swipe up");

                    var start = JSON.parse(el.getAttribute(settings.swipeUpInit)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    if(translate.translationY < 0 && 
                        Math.abs(translate.translationY) > settings.swipeUpThreshold){

                        that.swipeUpCallback(evt, null, translate);
                        el.setAttribute(settings.swipeUpInit, JSON.stringify(that.getTouchPoints(evt)));
                        el.setAttribute(settings.swipeDownInit, JSON.stringify(that.getTouchPoints(evt)));

                    }

                }

            }

            if(el.hasAttribute(settings.swipeDown)){
                
                if (!el.hasAttribute(settings.swipeDownEnd) &&
                            el.hasAttribute(settings.swipeDownInit)) {

                    console.log("should swipe down");

                    var start = JSON.parse(el.getAttribute(settings.swipeDownInit)),
                                end = that.getTouchPoints(evt),
                                translate = that.calculateTranslation(start, end);

                    if(translate.translationY > 0 && 
                        translate.translationY > settings.swipeDownThreshold){

                        that.swipeDownCallback(evt, null, translate);
                        el.setAttribute(settings.swipeUpInit, JSON.stringify(that.getTouchPoints(evt)));
                        el.setAttribute(settings.swipeDownInit, JSON.stringify(that.getTouchPoints(evt)));

                    }

                }

            }

            /*
            if (el.hasAttribute("data-rotate") && Math.abs(0.0019) > this.settings.rotateThreshold) {

            console.log("do touch rotate");
            //el.style.transform = m.rotate(e.rotation * 180 / Math.PI); // Apply Rotation

            //this.rotateCallback(e, m);
            }

            if (el.hasAttribute("data-scale") && Math.abs(e.scale) > this.settings.scaleThreshold) {

            console.log("do touch scale");

            //el.style.transform = m.scale(e.scale); // Apply Rotation
            //this.scaleCallback(e, m);
            }
            */

        },


        settings: {
                allowPageScroll: true,
                logging: false,
                swipeRightThreshold: 25,
                swipeLeftThreshold: -25,
                swipeUpThreshold: 25,
                swipeDownThreshold: 25,
                moveThreshold: 0,
                rotateThreshold: 0,
                scaleThreshold: 0,

                doubleTapThreshold: 700,

                //magic strings be gone!
                tapIndicator: "data-tap",
                tapStart: "data-tap-start",
                tapEnded: "data-tap-end",

                doubleTapIndicator: "data-dbltap",
                doubleTapStart: "data-dbltap-start",
                doubleTapEnded: "data-dbltap-end",


                rotateIndicator: "data-rotate",
                rotateEnded: "data-rotate-ended",
                rotateInitial: "data-rotate-initial",

                scaleIndicator: "data-scale",
                scaleEnded: "data-scale-ended",
                scaleInitial: "data-scale-initial",

                moveIndicator: "data-move",
                moveTouchEnded: "data-move-touch-ended",
                moveTouchInitial: "data-move-touch-initial",

                swipeRight: "data-swiperight",
                swipeRightInit: "data-swiperight-init",
                swipeRightEnd: "data-swiperight-end",

                swipeLeft: "data-swipeleft",
                swipeLeftInit: "data-swipeLeft-init",
                swipeLeftEnd: "data-swipeleft-end",

                swipeUp: "data-swipeup",
                swipeUpInit: "data-swipeup-init",
                swipeUpEnd: "data-swipeup-end",

                swipeDown: "data-swipedown",
                swipeDownInit: "data-swipedown-init",
                swipeDownEnd: "data-swipedown-end",

                horizontalIndicator: "data-move-horizontal",
                horizontalTouchInit: "data-horizontal-touch-initial",
                horizontalTouchEnd: "data-horizontal-touch-ended",

                verticalIndicator: "data-move-vertical",
                verticalTouchInit: "data-vertical-touch-initial",
                verticalTouchEnd: "data-vertical-touch-ended"

            }

    };

    // Give the init function the deeptissue prototype for later instantiation
    deeptissue.fn.init.prototype = deeptissue.fn;


    return (window.deeptissue = deeptissue);

} (window));
 