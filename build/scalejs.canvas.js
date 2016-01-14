
/*global define*/
define('scalejs.canvas/utils',[],function () {
    'use strict';

    var // Object that holds the offset based on size:
        getOffset = {
            left: function (size) {
                return 0;
            },
            top: function (size) {
                return 0;
            },
            center: function (size) {
                return -size / 2;
            },
            right: function (size) {
                return -size;
            },
            bottom: function (size) {
                return -size;
            }
        },
        // Object that holds offset+position data:
        applyOffset = {
            left: function (pos, size) {
                return pos;
            },
            top: function (pos, size) {
                return pos;
            },
            center: function (pos, size) {
                return pos - size / 2;
            },
            right: function (pos, size) {
                return pos - size;
            },
            bottom: function (pos, size) {
                return pos - size;
            }
        };

    return {
        getOffset: getOffset,
        applyOffset: applyOffset
    };
});
/*global define*/
define('scalejs.canvas/group',[
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
});
/*global define*/
define('scalejs.canvas/rect',[
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
});
/*global define*/
define('scalejs.canvas/text',[
    './utils'
], function (utils) {
    'use strict';

    return function (canvasObj) {
        function Text(opts) {
            this.type = "obj";
            this.className = "text";
            this.parent = opts.parent || canvasObj;
            this.id = opts.id || opts.parent.children.length;
            this.data = opts.data || {};
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
           // this.opacity = opts.opacity || 1;
            this.offset = { left: 0, top: 0 };
            this.pos = { left: 0, top: 0 };
            this.extents = { left: 0, top: 0, right: 0, bottom: 0 };
        }

        Text.prototype.setText = function (text) {
            // Compile font:
            if (this.fontFamily && this.fontSize) {
                this.font = this.fontSize + "px " + this.fontFamily;
                this.height = this.fontSize;
            } else {
                this.font = undefined;
                this.height = canvasObj.curFontSize;
            }
            // Check if text or font has changed, if so get width:
            if (this.font && (this.font !== this.calcFont || this.calcText !== this.text)) {
                canvasObj.context.save();
                canvasObj.context.font = this.font;
                this.text = text;
                this.width = canvasObj.context.measureText(text || "").width;
                canvasObj.context.restore();
                this.calcText = this.text;
                this.calcFont = this.font;
            } else if (!this.font && (canvasObj.curFont !== this.calcFont || this.calcText !== this.text)) {
                this.text = text;
                this.width = canvasObj.context.measureText(text || "").width;
                this.calcText = this.text;
                this.calcFont = canvasObj.curFont;
            }
        };

        Text.prototype.getExtents = function () {
            return this.extents;
        };

        Text.prototype.calcBounds = function () {
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
        };

        Text.prototype.render = function () {
            // Only render if text is visible (saves time):
            if (this.opacity > 0 && this.text.length > 0) {
                canvasObj.context.save();   // Required to restore transform matrix after the following render:
                this.font && this.font !== canvasObj.curFont && (canvasObj.context.font = this.font);
                this.fill && (canvasObj.context.fillStyle = this.fill);
                this.opacity < 1 && (canvasObj.context.globalAlpha *= this.opacity);
                canvasObj.context.translate(this.left, this.top);   // Set center.
                this.angle && canvasObj.context.rotate(this.angle * Math.PI / 180);   // Rotate text around center.
                canvasObj.context.fillText(this.text, this.offset.left, this.offset.top);   // Draw text at offset pos.
                canvasObj.context.restore();
            }
        };

        Text.prototype.isPointIn = function (posX, posY, event) {
            // Use the last extents (as it was last visible to user for click event):
            return posX >= this.extents.left && posY >= this.extents.top && posX <= this.extents.right && posY <= this.extents.bottom;
        };

        Text.prototype.touchEventHandler = function (posX, posY, event) {
            this[event.name] && this[event.name](this.data.data);
        };

        Text.prototype.remove = function () {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        };

        return Text;
    };
});
/*global define*/
define('scalejs.canvas/arc',[
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
});
/*global define*/
define('scalejs.canvas/selector',[
    './group',
    './rect',
    './text',
    './arc'
], function (
    Group,
    Rect,
    Text,
    Arc
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

    return function (canvasObj) {
        // Object that holds all object type constructors:
        var createObject = {
                group: Group(canvasObj),
                rect: Rect(canvasObj),
                text: Text(canvasObj),
                arc: Arc(canvasObj)
            },
            canvasSelector;

        function Selector(opts) {
            this.isTransition = opts.isTransition || false;
            this.durationTime = opts.durationTime || 250;
            this.easeFunc = opts.easeFunc || function (t) { return t; };
            this.endFunc = undefined;
            this.object = opts.object || canvasObj;
            this.objects = opts.objects || [];
            this.enterObjects = opts.enterObjects || [];
            this.updateObjects = opts.updateObjects || [];
            this.exitObjects = opts.exitObjects || [];
        }

        Selector.prototype.select = function (objectClassName) {
            var firstObj = [],
                object,
                i, j;

            if (typeof objectClassName === 'string') {
                // Get first object with the class that matches objectClassName, from each object in objects:
                for (i = 0; i < this.objects.length; i++) {
                    object = this.objects[i];
                    // Check to see if object has children:
                    if (object.children !== undefined && object.children.length > 0) {
                        // Look for first child with the specified class:
                        for (j = 0; j < object.children.length; j++) {
                            if (object.children[j].className === objectClassName) {
                                firstObj.push(object.children[j]);
                                break;
                            }
                        }
                    }
                }
                // Return a new selector with the first matching class in each object:
                return new Selector({
                    isTransition: this.isTransition,
                    durationTime: this.durationTime,
                    easeFunc: this.easeFunc,
                    object: firstObj.length > 0 ? firstObj[0].parent : (this.objects.length > 0 ? this.objects[0] : this.object), //Should rework this to accept more than one parent...
                    objects: firstObj
                });
            } else { // if they passed in the actual reference
                return new Selector({
                    isTransition: this.isTransition,
                    durationTime: this.durationTime,
                    easeFunc: this.easeFunc,
                    object: objectClassName,
                    objects: [objectClassName]
                });
            }

        };

        Selector.prototype.selectAll = function (objectClassName) {
            var objs = [],
                object,
                i, j;
            // Get all objects with class name as objectClassName:
            for (i = 0; i < this.objects.length; i++) {
                object = this.objects[i];
                // Check to see if object has children:
                if (object.children !== undefined && object.children.length > 0) {
                    // Loop through object's children:
                    for (j = 0; j < object.children.length; j++) {
                        if (object.children[j].className === objectClassName) {
                            objs.push(object.children[j]);  // Found, append to objs.
                        }
                    }
                }
            }
            // Return a new selector with all objects matching objectClassName:
            return new Selector({
                isTransition: this.isTransition,
                durationTime: this.durationTime,
                easeFunc: this.easeFunc,
                object: objs.length > 0 ? objs[0].parent : (this.objects.length > 0 ? this.objects[0] : this.object), //Should rework this to accept more than one parent...
                objects: objs
            });
        };

        Selector.prototype.filter = function (filterFunc) {
            var objs = [];
            // Get all objects where filterFunc returns true:
            for (var i = 0; i < this.objects.length; i++) {
                // Check if object should be added to new selector:
                if (filterFunc.call(this.objects[i], this.objects[i].data.data)) {
                    objs.push(this.objects[i]);
                }
            }
            // Return a new selector with all objects matching objectClassName:
            return new Selector({
                isTransition: this.isTransition,
                durationTime: this.durationTime,
                easeFunc: this.easeFunc,
                object: objs.length > 0 ? objs[0].parent : (this.objects.length > 0 ? this.objects[0] : this.object), //Should rework this to accept more than one parent...
                objects: objs
            });
        };

        Selector.prototype.data = function (nodes, keyFunc) {
            // TODO FINISH
            // Data is applied to those objects within the selection only!
            // Each time this is called, it checks against the objects var.
            //   If object with datakey exists in dataArray, it is kept in objects var.
            //   If a data's key doesn't have an object associated with it, the data is added in enterObjects var.
            //   If object's datakey isn't in dataArray, then the object is added to exitObjects var.
            // If nodes is a function, each object retrieves its data from nodes(curData)!
            // Else nodes contains the array of data for the objects.
            // TEMP FIX:
            // Generate a table filled with the nodes:
            var nodeTable = {};
            for (var i = 0; i < nodes.length; i++) {
                var key = keyFunc(nodes[i]);
                nodes[i] = {
                    id: key,
                    data: nodes[i]
                };
                nodeTable[key] = nodes[i];
            }
            // Populate the objects, updateObjects and exitObjects arrays:
            this.exitObjects = [];
            this.updateObjects = this.objects;
            this.objects = [];
            for (var i = 0; i < this.updateObjects.length; i++) {
                if (nodeTable[this.updateObjects[i].data.id]) {
                    this.updateObjects[i].data.data = nodeTable[this.updateObjects[i].data.id].data;
                    nodeTable[this.updateObjects[i].data.id] = undefined;
                    this.objects.push(this.updateObjects[i]);
                } else {
                    this.exitObjects.push(this.updateObjects[i]);
                    this.updateObjects.splice(i, 1);
                    i--;
                }
            }
            // Populate enterObjects array:
            for (var i = 0; i < nodes.length; i++) {
                if (!nodeTable[nodes[i].id]) {
                    nodes.splice(i, 1);
                    i--;
                }
            }
            this.enterObjects = nodes;
            // Return current selection (update selection):
            // TODO: Return new selection.
            return this;
        };

        Selector.prototype.enter = function () {
            // TODO FINISH
            // Returns enterObjects custom selector, with it's parent as this selector.
            // The selector adds exitObjects to the objects list of this selector when it appends (only function supported with this yet).
            return {
                parentSelector: this,
                append: function (objectClassName, opts) {
                    opts = opts || {};
                    return new Selector({
                        isTransition: this.parentSelector.isTransition,
                        durationTime: this.parentSelector.durationTime,
                        easeFunc: this.parentSelector.easeFunc,
                        objects: this.parentSelector.enterObjects.map(function (object) {
                            opts.parent = this.parentSelector.object;  // Set parent of child to object.
                            opts.data = object;    // Pass data to child!
                            var newObj = new createObject[objectClassName](opts);   // Create child.
                            this.parentSelector.object.children.push(newObj);  // Add child to object.
                            return newObj;  // Add child to new selector.
                        }, this)
                    });
                }
            };
            // Rethink selectors in order to properly append items into the right parents!
        };

        Selector.prototype.update = function () {
            // Returns selector with updateObjects as objects:
            var newSelector = new Selector(this);
            newSelector.objects = this.updateObjects;
            return newSelector;
        }

        Selector.prototype.exit = function () {
            // TODO FINISH
            // Returns exitObjects custom selector, with it's parent as this selector.
            // The selector removes exitObjects from the objects list of this selector when it removes (only function supported with this yet).
            var newSelector = new Selector(this);
            newSelector.objects = this.exitObjects;
            return newSelector;
        };

        Selector.prototype.on = function (eventName, eventFunc) {
            // Map given name to internal property:
            eventName = "on" + eventName;
            // Add property to every object in selector:
            this.objects.forEach(function (object) {
                object[eventName] = eventFunc;
            });
            return this;
        };

        Selector.prototype.append = function (objectClassName, opts) {
            opts = opts || {};  // Make sure opts exists.
            // Return a new selector of all appended objects:
            var newSelector = new Selector(this);
            newSelector.objects = this.objects.map(function (object) { // For each object in selector, append a new object:
                opts.parent = object;       // Set parent of child to object.
                opts.data = object.data;    // Pass data to child!
                var newObj = new createObject[objectClassName](opts);   // Create child.
                object.children.push(newObj);   // Add child to object.
                return newObj;  // Add child to new selector.
            });
            return newSelector;
        };

        Selector.prototype.remove = function () {
            // Loop through all objects, and remove them from their individual parent:
            this.objects.forEach(function (object) {
                object.parent.children.splice(object.parent.children.indexOf(object), 1);
            });
            // Reset selector's objects list:
            this.objects = [];
            return this;
            // TODO: Read d3 docs on what to return!
        };

        Selector.prototype.attr = function (attrName, attrVal) {
            this.objects.forEach(function (object) {
                if (attrVal instanceof Function) {
                    attrVal = attrVal.call(object, object.data.data);
                }
                if (object["set" + attrName] instanceof Function) {
                    object["set" + attrName](attrVal);
                } else {
                    object[attrName] = attrVal;
                }
            });
            return this;
        };

        Selector.prototype.sort = function (compFunc) {
            // Sort objects in selection:
            this.objects.sort(function (a, b) {
                return compFunc(a.data.data, b.data.data);
            });
            return this;
        };

        Selector.prototype.order = function () {
            // Apply object order in selection to render scene:
            this.objects.forEach(function (object) {
                // First start by removing the objects:
                object.parent.children.splice(object.parent.children.indexOf(object), 1);
                // Then put it back at the end:
                object.parent.children.push(object);
            });
            return this;
        };

        Selector.prototype.each = function (func, listener) {
            // Execute a given function for each object:
            if (listener === undefined || listener === "start") {
                this.objects.forEach(function (object) { func.call(object, object.data.data); });
            } else if (listener === "end") {
                this.objects.forEach(function (object) { object.tweenEndFunc = func; });
                //this.endFunc = func;
            }
            return this;
        };

        Selector.prototype.transition = function () {
            // Return a new selector with the first matching class in each object:
            var newSelector = new Selector(this);
            newSelector.isTransition = true;
            newSelector.objects.forEach(function (object) { object.tweenEndFunc = undefined; });
            return newSelector;
        };

        Selector.prototype.duration = function (ms) {
            // Set selector's duration of a transition:
            this.durationTime = ms;
            return this;
        };

        Selector.prototype.ease = function (type) {
            // Set selector's ease function:
            this.easeFunc = type;
            return this;
        };

        Selector.prototype.tween = function (tweenName, tweenFunc) {
            // TODO: Register tweenFunc for all objects in this selector.
            // Setup timeout:
            var timeStart = new Date().getTime(),
                timeEnd = timeStart + this.durationTime,
                object,
                i;
            // Register object on canvas's animation array. If object already is there, then replace the current tween.
            for (i = 0; i < this.objects.length; i++) {
                object = this.objects[i];
                // TODO: Make animation's ID based to test speed.
                if (!(object.animationIndex >= 0)) {
                    object.animationIndex = canvasObj.animations.length;
                    canvasObj.animations[object.animationIndex] = object;
                }
                object.tweenFunc = tweenFunc.call(object, object.data.data);
                object.easeFunc = this.easeFunc;
                object.timeStart = timeStart;
                object.timeEnd = timeEnd;
                object.duration = this.durationTime;
            }
            if (canvasObj.requestFrameID === undefined && canvasObj.animations.length > 0) {
                canvasObj.requestFrameID = requestAnimFrame(function () { canvasObj.onAnimationFrame(); });
            }
            return this;
        };

        Selector.prototype.startRender = function () { }; // This function is a temp fix to render the canvas!

        Selector.prototype.pumpRender = function () {
            // This function is a temp fix to render the canvas!
            canvasObj.pumpRender();
            return canvasSelector;
        };

        canvasSelector = new Selector({
            objects: [canvasObj]
        });
        canvasSelector[0] = [canvasObj.element]; // Temp Fix to access element!

        return canvasSelector;
    };
});
/*global define*/
define('scalejs.canvas/canvas',[
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
/*global define*/
define('scalejs.canvas',[
    'scalejs!core',
    './scalejs.canvas/canvas'
], function (
    core,
    canvas
) {
    'use strict';

    // There are few ways you can register an extension.
    // 1. Core and Sandbox are extended in the same way:
    //      core.registerExtension({ part1: part1 });
    //
    // 2. Core and Sandbox are extended differently:
    //      core.registerExtension({
    //          core: {corePart: corePart},
    //          sandbox: {sandboxPart: sandboxPart}
    //      });
    //
    // 3. Core and Sandbox are extended dynamically:
    //      core.registerExtension({
    //          buildCore: buildCore,
    //          buildSandbox: buildSandbox
    //      });
    core.registerExtension({
        canvas: canvas
    });

    return canvas;
});


