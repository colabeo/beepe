define(function(require, exports, module) {

    var Surface = require('famous/core/Surface');

    function ConversationSurface(opts) {
        Surface.apply(this, arguments);
        this.setSize([undefined, true]);
    };

    ConversationSurface.prototype = Object.create(Surface.prototype);
    //ConversationSurface.prototype.surfaceEvents = Surface.prototype.surfaceEvents.concat(['load']);

    ConversationSurface.prototype.deploy = function (target) {
        Surface.prototype.deploy.apply(this, arguments);
        this.__size = [target.offsetWidth, target.offsetHeight];
    };

    ConversationSurface.prototype.getSize = function () {
        return this.__size || this._size || this.size;
    };

    module.exports = ConversationSurface;

});
