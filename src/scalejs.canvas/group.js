/*global define*/
define([
    './utils'
], function (utils) {
    'use strict';

    return function (canvasObj) {
        function Group(opts) {
            this.type = "group";
            this.className = "group";
            this.parent = opts.parent || canvasObj;
            this.id = opts.id || opts.parent.children.length;
            this.data = opts.data || {};
            this.fontFamily = opts.fontFamily || "";
            this.fontSize = opts.fontSize || 0;
            this.originX = opts.originX || "left";
            this.originY = opts.originY || "top";
            this.left = opts.left || 0;
            this.top = opts.top || 0;
            this.width = opts.width || 0;
            this.height = opts.height || 0;
            this.angle = opts.angle || 0;
            this.scaleX = opts.scaleX || 1;
            this.scaleY = opts.scaleY || 1;
            this.backFill = opts.backFill || "";
            this.opacity = opts.opacity || 1;
            this.offset = { left: 0, top: 0 };
            this.pos = { left: 0, top: 0 };
            this.extents = { left: 0, top: 0, right: 0, bottom: 0 };
            this.children = [];
        }

        Group.prototype.getExtents = function () {
            return this.extents;
        };

        Group.prototype.calcBounds = function () {
            var pFont, pSize;
            // Check if font is set on group:
            if (this.fontFamily && this.fontSize) {
                // Compile font:
                this.font = this.fontSize + "px " + this.fontFamily;
                if (this.font !== canvasObj.curFont) {
                    pFont = canvasObj.curFont;
                    pSize = canvasObj.curFontSize;
                    canvasObj.context.save();
                    canvasObj.context.font = this.font;
                    canvasObj.curFont = this.font;
                    canvasObj.curFontSize = this.fontSize;
                } 
            } else {
                this.font = undefined;
            }

            // Calculate children's boundaries and parameters:
            for (var i = 0; i < this.children.length; i++) this.children[i].calcBounds();

            if (pFont) {
                canvasObj.curFont = pFont;
                canvasObj.curFontSize = pSize;
                canvasObj.context.restore();
            }

            this.offset.left = utils.getOffset[this.originX](this.width);
            this.offset.top = utils.getOffset[this.originY](this.height);
            this.pos.left = this.left + this.offset.left;
            this.pos.top = this.top + this.offset.top;
            this.radianAngle = this.angle * Math.PI / 180;
        };

        Group.prototype.render = function () {
            if (this.opacity <= 0) return;
            canvasObj.context.save();   // Required to restore transform matrix after the following render:
            this.opacity < 1 && (canvasObj.context.globalAlpha *= this.opacity);
            canvasObj.context.translate(this.pos.left, this.pos.top);   // Set group center.
            canvasObj.context.scale(this.scaleX, this.scaleY);  // Scale group at center.
            canvasObj.context.rotate(this.radianAngle);   // Rotate group at center.
            if (this.backFill && this.width > 0 && this.height > 0) {
                canvasObj.context.fillStyle = this.backFill;
                canvasObj.context.fillRect(0, 0, this.width, this.height);
            }
            if (this.font && this.font !== canvasObj.curFont) {    // Set font if a global font is set.
                // Save previous family and size:
                var pFont = canvasObj.curFont,
                    pFontSize = canvasObj.curFontSize;
                // Set font and family and size:
                canvasObj.context.font = this.font;
                //canvasObj.context.fontFamily = this.fontFamily;
                canvasObj.curFont = this.font;
                canvasObj.curFontSize = this.fontSize;
                // Render children:
                for (var i = 0; i < this.children.length; i++) this.children[i].render();
                // Restore family and size:
                canvasObj.curFont = pFont;
                canvasObj.curFontSize = pFontSize;
            } else {
                // Render children:
                for (var i = 0; i < this.children.length; i++) this.children[i].render();
            }
            canvasObj.context.restore();
        };

        Group.prototype.isPointIn = function (posX, posY, event) {
            // Remove translate:
            posX -= this.pos.left;
            posY -= this.pos.top;
            // Remove scale:
            posX /= this.scaleX;
            posY /= this.scaleY;
            // Remove rotate:
            var sin = Math.sin(-this.radianAngle),
                cos = Math.cos(-this.radianAngle),
                tposX = posX;
            posX = posX * cos - posY * sin;
            posY = tposX * sin + posY * cos;
            // Loop through all children and check if the point is in:
            if (this.backFill) {
                return posX >= 0 && posY >= 0 && posX <= this.width && posY <= this.height;
            }
            // Check if point in children:
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].isPointIn(posX, posY, event)) return true;
            }
            return false;
            // Use the last extents (as it was last visible to user for click event):
            //return posX >= this.extents.left && posY >= this.extents.top && posX <= this.extents.right && posY <= this.extents.bottom;
        };

        Group.prototype.touchEventHandler = function (posX, posY, event) {
            // Translate position:
            //canvasObj.context.translate(this.pos.left, this.pos.top);
            posX -= this.pos.left;
            posY -= this.pos.top;
            // Scale Position:
            //canvasObj.context.scale(1 / this.scaleX, 1 / this.scaleY);
            posX /= this.scaleX;
            posY /= this.scaleY;
            // Rotate position:
            //canvasObj.context.rotate(-this.radianAngle);
            var sin = Math.sin(-this.radianAngle),
                cos = Math.cos(-this.radianAngle),
                tposX = posX;
            posX = posX * cos - posY * sin;
            posY = tposX * sin + posY * cos;
            // Loop through all children and check if they have been clicked:
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].isPointIn(posX, posY, event)) {
                    this.children[i].touchEventHandler(posX, posY, event);
                }
            }
            this[event.name] && this[event.name](this.data.data);
        };

        Group.prototype.remove = function () {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        };

        return Group;
    };
})