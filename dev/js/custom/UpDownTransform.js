define(function(require, exports, module) {

    var Transform = require('famous/core/Transform');
    var Easing = require('famous/transitions/Easing');

    function UpDownTransform(options) {
        this.options = {
            inTransform: Transform.translate(0, 1500, 0),
            inOpacity: 1,
            inOrigin: [0.5, 0.5],
            outTransform: Transform.translate(0, 600, 0),
            outOpacity: 1,
            outOrigin: [0.5, 0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            showOrigin: [0.5, 0.5],
            inTransition: {duration: 500, curve: Easing.inQuad()},
            outTransition: {duration: 100, curve: Easing.outQuint()},
            overlap: true
        };
    }

    module.exports = UpDownTransform;

});
