var Matrix = require('famous/transform');
var Modifier = require('famous/modifier');
var RenderNode = require('famous/render-node');
var Utility = require('famous/utilities/utility');

/** @constructor */
function LightBox(options) {
    this.options = {
        inTransform: Matrix.scale(0.001, 0.001, 0.001),
        inOpacity: 0,
        inOrigin: [0.5, 0.5],
        outTransform: Matrix.scale(0.001, 0.001, 0.001),
        outOpacity: 0,
        outOrigin: [0.5, 0.5],
        showTransform: Matrix.identity,
        showOpacity: 1,
        showOrigin: [0.5, 0.5],
        inTransition: true,
        outTransition: true,
        overlap: false
    };

    if(options) this.setOptions(options);

    this._showing = false;
    this.nodes = [];
    this.transforms = [];
};

LightBox.prototype.getOptions = function() {
    return this.options;
};

LightBox.prototype.setOptions = function(options) {
    if(options.inTransform !== undefined) this.options.inTransform = options.inTransform;
    if(options.inOpacity !== undefined) this.options.inOpacity = options.inOpacity;
    if(options.inOrigin !== undefined) this.options.inOrigin = options.inOrigin;
    if(options.outTransform !== undefined) this.options.outTransform = options.outTransform;
    if(options.outOpacity !== undefined) this.options.outOpacity = options.outOpacity;
    if(options.outOrigin !== undefined) this.options.outOrigin = options.outOrigin;
    if(options.showTransform !== undefined) this.options.showTransform = options.showTransform;
    if(options.showOpacity !== undefined) this.options.showOpacity = options.showOpacity;
    if(options.showOrigin !== undefined) this.options.showOrigin = options.showOrigin;
    if(options.inTransition !== undefined) this.options.inTransition = options.inTransition;
    if(options.outTransition !== undefined) this.options.outTransition = options.outTransition;
    if(options.overlap !== undefined) this.options.overlap = options.overlap;
};

LightBox.prototype.show = function(renderable, transition, callback) {
    this.curRenderable = renderable;
    if(!renderable) {
        return this.hide(callback);
    }

    if(transition instanceof Function) {
        callback = transition;
        transition = undefined;
    }

    if(this._showing) {
        if(this.options.overlap) this.hide();
        else {
            this.hide(this.show.bind(this, renderable, callback));
            return;
        }
    }
    this._showing = true;
    //new options setting of a new renderable.
    if (renderable.options) this.setOptions(renderable.options);

    var transform = new Modifier({
        transform: this.options.inTransform,
        opacity: this.options.inOpacity,
        origin: this.options.inOrigin
    });
    var node = new RenderNode();
    node.add(transform).add(renderable);
    this.nodes.push(node);
    this.transforms.push(transform);

    var _cb = callback ? Utility.after(3, callback) : undefined;

    if(!transition) transition = this.options.inTransition;
    transform.setTransform(this.options.showTransform, transition, _cb);
    transform.setOpacity(this.options.showOpacity, transition, _cb);
    transform.setOrigin(this.options.showOrigin, transition, _cb);
};

LightBox.prototype.hide = function(transition, callback) {
    if(!this._showing) return;
    this._showing = false;

    if(transition instanceof Function) {
        callback = transition;
        transition = undefined;
    }

    var node = this.nodes[this.nodes.length - 1];
    var transform = this.transforms[this.transforms.length - 1];
    var _cb = Utility.after(3, function() {
        this.nodes.splice(this.nodes.indexOf(node), 1);
        this.transforms.splice(this.transforms.indexOf(transform), 1);
        if(callback) callback.call(this);
    }.bind(this));

    if(!transition) transition = this.options.outTransition;
    transform.setTransform(this.options.outTransform, transition, _cb);
    transform.setOpacity(this.options.outOpacity, transition, _cb);
    transform.setOrigin(this.options.outOrigin, transition, _cb);
};

LightBox.prototype.render = function() {
    var result = [];
    for(var i = 0; i < this.nodes.length; i++) {
        result.push(this.nodes[i].render());
    }
    return result;
};

module.exports = LightBox;
