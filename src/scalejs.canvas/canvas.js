/*global define*/
define([
    'hammer',
    './selector'
], function (
    hammer,
    selector
) {
    'use strict';

    // Get requestAnimationFrame function based on which browser:
    var requestAnimFrame = window.requestAnimationFrame ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame ||
                           function (callback) {
                               window.setTimeout(callback, 1000 / 60);
                               return true; // return something for requestFrameID
                           };

    function canvas(element) {
        this.type = "canvas";
        this.className = "canvas";
        this.element = element;
        this.context = element.getContext("2d");
        this.parent = this;
        this.width = element.width;
        this.height = element.height;
        this.children = [];
        this.animations = [];
        this.requestFrameID = undefined;
        this.curFont = "";
        this.curFontSize = 0;
    }

    canvas.prototype.setwidth = function (width) {
        this.element.width = width;
        this.width = width;
    };

    canvas.prototype.setheight = function (height) {
        this.element.height = height;
        this.height = height;
    };

    canvas.prototype.onAnimationFrame = function () {
        // Check if there is anything to animate:
        if (this.animations.length <= 0 || this.width <= 0 || this.height <= 0) {   // Width and height check can be removed if animations MUST be called. This was originally added since d3 had issues.
            this.requestFrameID = undefined;
            return;
        }
        // Request to call this function on next frame (done before rendering to make animations smoother):
        var thisCanvas = this;
        this.requestFrameID = requestAnimFrame(function () { thisCanvas.onAnimationFrame(); }); // Encapsulate onAnimationFrame to preserve context.
        // Get current time to test if animations are over:
        var curTime = new Date().getTime(),
            animation;
        // Execute all animations, filter out any that are finished:
        for (var i = 0; i < this.animations.length; i++) {
            animation = this.animations[i];
            // Call tween function for object:
            var timeRatio = Math.min((curTime - animation.timeStart) / animation.duration, 1);  // Get the current animation frame which is can be [0, 1].
            animation.tweenFunc(animation.easeFunc(timeRatio)); // Call animation tween function.
            // Filter out animations which exceeded the time:
            if (curTime >= animation.timeEnd) {
                animation.animationIndex = undefined;
                animation.tweenEndFunc && animation.tweenEndFunc(animation.data.data);
                this.animations.splice(i, 1);
                i--;
            } else {
                // Update index:
                animation.animationIndex = i;
            }
        }
        // Render objects:
        this.render();
    };

    canvas.prototype.render = canvas.prototype.pumpRender = function () {
        if (this.width <= 0 || this.height <= 0) return;
        // Reset transform:
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        // Clear globals:
        this.context.font = "40px Times New Roman";
        this.curFont = "40px Times New Roman";
        //this.curFontFamily = "Times New Roman";
        this.curFontSize = 40;

        // Calculate children's boundaries and parameters:
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].calcBounds();
        }

        // Clear canvas:
        this.context.clearRect(0, 0, this.element.width, this.element.height);
        // Render children:
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].render();
        }
    };

    canvas.prototype.startRender = function () {
        console.warn("canvas.startRender is deprecated!");
    };

    function select(canvasElement) {
        var // Canvas object (unique to each canvas):
            canvasObj = new canvas(canvasElement);

        function touchEventHandler(event) {
            // Ignore event with no gesture:
            
            /*
            if (!event.gesture) {
                return;
            }
            event.gesture.preventDefault();
            */
            
            // Ignore events with more than one touch.
            //if (event.gesture.touches.length === 1) {
                // Calculate offset from target's top-left corner:
                var touch = event.pointers[0],       // Get touch location on page.
                    display = event.target.style.display,   // Save display property.
                    pagePos;                                // Get target position on page.
                    
                event.target.style.display = "";    // Make visible
                pagePos = event.target.getBoundingClientRect(); // Get visible coords.
                event.target.style.display = display;   // Restore display property.
                event.offsetX = touch.clientX - pagePos.left;
                event.offsetY = touch.clientY - pagePos.top;
                event.name = "on" + event.type;

                // Loop through every child object on canvas and check if they have been clicked:
                for (var i = 0; i < canvasObj.children.length; i++) {
                    // Check if mouse is in child:
                    if (canvasObj.children[i].isPointIn(event.offsetX, event.offsetY, event)) {
                        // If so, propagate event down to child.
                        canvasObj.children[i].touchEventHandler(event.offsetX, event.offsetY, event);
                    }
                }
            //}
        }

        var hammerObj = hammer(canvasObj.element, {
            prevent_default: true,
            drag_min_distance: 10,
            hold_threshold: 10
        });
        hammerObj.on("hold tap doubletap touch release", touchEventHandler);

        // Return the canvas selector:
        return selector(canvasObj);
    }

    return {
        select: select
    };
});