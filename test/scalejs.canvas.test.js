define([
    'scalejs!core', 'scalejs!application'
], function(
    core
) {
    var canvas = core.canvas;

    // For deeper testing, log to console
    console.log('core.canvas: ', canvas);

    describe('core.canvas', function() {

        it('is defined', function() {
            expect(canvas).toBeDefined();
        });

    });
});
