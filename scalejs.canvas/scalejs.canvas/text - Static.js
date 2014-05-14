/*global define*/
define([
    './utils'
], function (utils) {
    'use strict';

    return function (canvasObj) {
        function text(opts) {
            this.type = "obj";
            this.className = "text";
            this.parent = opts.parent || canvasObj;
            this.id = opts.id || opts.parent.children.length;
            this.data = opts.data || {};
            this.static = opts.static || false;
            this.wasStatic = this.static,//opts.wasStatic || false;
            this.fontFamily = opts.fontFamily || "";//"Times New Roman";
            this.fontSize = opts.fontSize || 0;//40;
            this.text = opts.text || "";
            this.originX = opts.originX || "left";
            this.originY = opts.originY || "top";
            this.left = opts.left || 0;
            this.top = opts.top || 0;
            this.width = opts.width || 0;
            this.height = opts.height || 0;
            this.angle = opts.angle || 0;
            this.fill = opts.fill || "#000";
            this.opacity = opts.opacity || 1;
            this.offset = { left: 0, top: 0 };
            this.pos = { left: 0, top: 0 };
            this.extents = { left: 0, top: 0, right: 0, bottom: 0 };
            this.calcBoundsFunc = this.static ? calcBoundsStatic : calcBoundsDynamic;
            this.renderFunc = this.static ? renderStatic : renderDynamic;
            if (this.static) {
                this.buffer = document.createElement('canvas');
                this.buffer.width = this.width;
                this.buffer.height = this.height;
                this.context = this.buffer.getContext("2d");
                this.font && (canvasObj.context.font = this.font);
                this.fill && (canvasObj.context.fillStyle = this.fill);
                this.context.fillText(this.text, 0, this.height);
            }
        }

        text.prototype.setText = function (text) {
            // Compile font:
            if (this.fontFamily && this.fontSize) {
                this.font = this.fontSize + "px " + this.fontFamily;
                this.height = this.fontSize;
            } else {
                this.height = canvasObj.context.fontSize;
            }
            // Check if text has changed, if so get width:
            if (this.calcText !== this.text) {
                canvasObj.context.save();
                this.font && (canvasObj.context.font = this.font);  // Only set font if not using the global font.
                //canvasObj.context.fillStyle = this.fill;  // not needed to compute width
                this.text = text;
                this.width = canvasObj.context.measureText(text || "").width;
                canvasObj.context.restore();
                this.calcText = this.text;
            }
        };

        text.prototype.getExtents = function () {
            return this.extents;
        };

        function calcBoundsDynamic() {
            // Calculate boundaries and additional parameters:
            this.setText(this.text);
            this.offset.left = utils.getOffset[this.originX](this.width);
            this.offset.top = utils.getOffset[this.originY](this.height) + this.height;
            this.pos.left = this.left + this.offset.left;
            this.pos.top = this.top + this.offset.top;
            this.extents.left = this.pos.left;
            this.extents.right = this.pos.left;
            this.extents.top = this.pos.top + this.width;
            this.extents.bottom = this.pos.top + this.height;
            if (this.static && !this.wasStatic) {
                this.buffer = document.createElement('canvas');
                this.buffer.width = this.width;
                this.buffer.height = this.height;
                this.context = this.buffer.getContext("2d");
                this.font && (canvasObj.context.font = this.font);
                this.fill && (canvasObj.context.fillStyle = this.fill);
                this.context.fillText(this.text, 0, this.height);
                this.wasStatic = true;
                this.calcBoundsFunc = calcBoundsStatic;
                this.renderFunc = renderStatic;
            }
        };
        function calcBoundsStatic() {
            // Calculate boundaries and additional parameters:
            this.setText(this.text);
            this.offset.left = utils.getOffset[this.originX](this.width);
            this.offset.top = utils.getOffset[this.originY](this.height) + this.height;
            this.pos.left = this.left + this.offset.left;
            this.pos.top = this.top + this.offset.top;
            this.extents.left = this.pos.left;
            this.extents.right = this.pos.left;
            this.extents.top = this.pos.top + this.width;
            this.extents.bottom = this.pos.top + this.height;
            if (!this.static && this.wasStatic) {
                this.buffer = undefined;
                this.context = undefined;
                this.wasStatic = false;
                this.calcBoundsFunc = calcBoundsDynamic;
                this.renderFunc = renderDynamic;
            }
        };

        text.prototype.calcBounds = function () {
            this.calcBoundsFunc();
        };

        function renderDynamic() {
            // Only render if text is visible (saves time):
            if (this.opacity > 0 && this.text.length > 0) {
                canvasObj.context.save();   // Required to restore transform matrix after the following render:
                this.font && (canvasObj.context.font = this.font);
                this.fill && (canvasObj.context.fillStyle = this.fill);
                this.opacity < 1 && (canvasObj.context.globalAlpha = this.opacity);
                canvasObj.context.translate(this.left, this.top);   // Set center.
                this.angle && canvasObj.context.rotate(this.angle * Math.PI / 180);   // Rotate text around center.
                canvasObj.context.fillText(this.text, this.offset.left, this.offset.top);   // Draw text at offset pos.
                canvasObj.context.restore();
            }
        };

        function renderStatic() {
            // Only render if text is visible (saves time):
            if (this.opacity > 0 && this.text.length > 0) {
                canvasObj.context.save();   // Required to restore transform matrix after the following render:
                this.opacity < 1 && (canvasObj.context.globalAlpha = this.opacity);
                canvasObj.context.translate(this.left, this.top);   // Set center.
                this.angle && canvasObj.context.rotate(this.angle * Math.PI / 180);   // Rotate text around center.
                canvasObj.context.drawImage(this.buffer, this.offset.left, this.offset.top);   // Draw text at offset pos.
                canvasObj.context.restore();
            }
        };

        text.prototype.render = function () {
            this.renderFunc();
        };

        text.prototype.isPointIn = function (posX, posY, event) {
            // Use the last extents (as it was last visible to user for click event):
            return posX >= this.extents.left && posY >= this.extents.top && posX <= this.extents.right && posY <= this.extents.bottom;
        };

        text.prototype.mouseDownEvent = function (posX, posY, event) {
            this.onmousedown && this.onmousedown.call(this, this.data.data);
        };

        return text;
    };
})