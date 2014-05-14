/*global define*/
define([
    './utils'
], function (utils) {
    'use strict';

    return function (canvasObj) {
        function Rect(opts) {
            this.type = "obj";
            this.className = "rect";
            this.parent = opts.parent || canvasObj;
            this.id = opts.id || opts.parent.children.length;
            this.data = opts.data || {};
            this.originX = opts.originX || "left";
            this.originY = opts.originY || "top";
            this.left = opts.left || 0;
            this.top = opts.top || 0;
            this.width = opts.width || 0;
            this.height = opts.height || 0;
            this.fill = opts.fill || "#000";
            this.offset = { left: 0, top: 0 };
            this.pos = { left: 0, top: 0 };
            this.extents = { left: 0, top: 0, right: 0, bottom: 0 };
        }

        Rect.prototype.getExtents = function () {
            return this.extents;
        };

        Rect.prototype.calcBounds = function () {
            // Calculate boundaries and additional parameters:
            this.offset.left = utils.getOffset[this.originX](this.width);
            this.offset.top = utils.getOffset[this.originY](this.height);
            this.pos.left = this.left + this.offset.left;
            this.pos.top = this.top + this.offset.top;
            this.extents.left = this.pos.left;
            this.extents.top = this.pos.top;
            this.extents.right = this.pos.left + this.width;
            this.extents.bottom = this.pos.top + this.height;
        };

        Rect.prototype.render = function () {
            if (this.width > 0 && this.height > 0) {
                //canvasObj.context.save();
                canvasObj.context.fillStyle = this.fill;
                canvasObj.context.fillRect(this.pos.left, this.pos.top, this.width, this.height);
                //canvasObj.context.restore();
            }
        };

        Rect.prototype.isPointIn = function (posX, posY, event) {
            // Use the last extents (as it was last visible to user for click event):
            return posX >= this.extents.left && posY >= this.extents.top && posX <= this.extents.right && posY <= this.extents.bottom;
        };

        Rect.prototype.touchEventHandler = function (posX, posY, event) {
            this[event.name] && this[event.name](this.data.data);
        };

        Rect.prototype.remove = function () {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        };

        return Rect;
    };
})