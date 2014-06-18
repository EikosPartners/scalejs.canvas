/*global define*/
define([
    './utils'
], function (utils) {
    'use strict';

    var deg90InRad = Math.PI * 0.5; // 90 degrees in radians.

    return function (canvasObj) {
        function Arc(opts) {
            this.type = "obj";
            this.className = "arc";
            this.parent = opts.parent || canvasObj;
            this.id = opts.id || opts.parent.children.length;
            this.data = opts.data || {};
            this.originX = opts.originX || "center";
            this.originY = opts.originY || "center";
            this.left = opts.left || 0;
            this.top = opts.top || 0;
            this.width = opts.width || 0;
            this.height = opts.height || 0;
            this.radius = 0;
            this.innerRadius = opts.innerRadius || 0;
            this.outerRadius = opts.outerRadius || 0;
            this.thickness = 0;
            this.startAngle = opts.startAngle || 0;
            this.endAngle = opts.endAngle || 0;
            this.fill = opts.fill || "#000";
            this.opacity = opts.opacity || 1;
            this.offset = { left: 0, top: 0 };
            this.pos = { left: 0, top: 0 };
            this.extents = { left: 0, top: 0, right: 0, bottom: 0 };
        }

        Arc.prototype.getExtents = function () {
            return this.extents;
        };

        Arc.prototype.calcBounds = function () {
            // Calculate boundaries and additional parameters:
            this.width = this.height = this.outerRadius * 2;
            this.offset.left = this.left;//utils.applyOffset[this.originX](this.left, this.width) + this.width;
            this.offset.top = this.top;//utils.applyOffset[this.originY](this.top, this.height) + this.height;
            this.extents.left = this.offset.left - this.outerRadius;
            this.extents.right = this.offset.left + this.outerRadius;
            this.extents.top = this.offset.top - this.outerRadius;
            this.extents.bottom = this.offset.top + this.outerRadius;
            this.thickness = this.outerRadius - this.innerRadius;
            this.radius = this.thickness / 2 + this.innerRadius;
        };

        Arc.prototype.render = function () {
            if (this.opacity > 0 && this.thickness !== 0 && this.endAngle !== this.startAngle) {
                //canvasObj.context.save();
                canvasObj.context.beginPath();
                this.fill && (canvasObj.context.strokeStyle = this.fill);
                this.opacity < 1 && (canvasObj.context.globalAlpha *= this.opacity);
                canvasObj.context.lineWidth = this.thickness;
                canvasObj.context.arc(this.offset.left, this.offset.top, this.radius, this.startAngle - deg90InRad, this.endAngle - deg90InRad);
                canvasObj.context.stroke();
                //canvasObj.context.restore();


                // Highlighting code
                if (this.highlight) {
                    canvasObj.context.strokeStyle = '#FFFFFF';
                    canvasObj.context.lineWidth = 6;
                    var oldAlpha = canvasObj.context.globalAlpha;
                    canvasObj.context.globalAlpha = this.highlight;

                    if ((this.startAngle !== 0) && (this.startAngle !== Math.PI * 2)) { // if the arc is less than 360 degre
                        canvasObj.context.beginPath();
                        canvasObj.context.arc(this.offset.left, this.offset.top, (this.outerRadius - 3 * (1 - (this.highlight * 0.2))), this.startAngle - deg90InRad, this.endAngle - deg90InRad, false);
                        canvasObj.context.arc(this.offset.left, this.offset.top, this.innerRadius + 3, this.endAngle - deg90InRad, this.startAngle - deg90InRad, true);
                        canvasObj.context.arc(this.offset.left, this.offset.top, (this.outerRadius - 3 * (1 - (this.highlight * 0.2))), this.startAngle - deg90InRad, this.endAngle - deg90InRad, false);
                        canvasObj.context.stroke();
                    } else {
                        canvasObj.context.beginPath();
                        canvasObj.context.arc(this.offset.left, this.offset.top, this.outerRadius - 3, this.startAngle - deg90InRad, this.endAngle - deg90InRad, false);
                        canvasObj.context.stroke();
                        if (this.innerRadius !== 0) {
                            canvasObj.context.beginPath();
                            canvasObj.context.arc(this.offset.left, this.offset.top, this.innerRadius + 3, this.endAngle - deg90InRad, this.startAngle - deg90InRad, true);
                            canvasObj.context.stroke();
                        }

                    }
                    canvasObj.context.globalAlpha = oldAlpha;
                }

            }
        };

        Arc.prototype.isPointIn = function (posX, posY, event) {
            // Use the last extents (as it was last visible to user for click event):
            var distance = (posX - this.offset.left) * (posX - this.offset.left) + (posY - this.offset.top) * (posY - this.offset.top), // Distance from point to arc center.
                angle = Math.atan2(posY - this.offset.top, posX - this.offset.left) + deg90InRad;   // Angle from +x axis to arc center to pointer.
            if (angle < 0) {
                angle += 2 * Math.PI;   // This is to fix the differences in d3 start/end angle and canvas's.
                // d3 has: [0, 2 * Math.PI], which starts from and goes to (+)y-axis.
                // canvas has: [-Math.PI, Math.PI], which starts from and goes to (-)x-axis.
            }
            return distance <= this.outerRadius * this.outerRadius && distance >= this.innerRadius * this.innerRadius && angle >= this.startAngle && angle <= this.endAngle;
        };

        Arc.prototype.touchEventHandler = function (posX, posY, event) {
            this[event.name] && this[event.name](this.data.data);
        };

        Arc.prototype.remove = function () {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        };

        return Arc;
    };
})