/*global define*/
define(function () {
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