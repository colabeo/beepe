var EventHandler = require('famous/core/EventHandler');

/**
 * @class Handles piped in mouse drag events. Outputs an object with two
 *        properties, position and velocity.
 * @description
 * @name MouseSync
 * @constructor
 * @example
 * 
 *     var Engine = require('famous/Engine');
 *     var Surface = require('famous/Surface');
 *     var Modifier = require('famous/Modifier');
 *     var FM = require('famous/Matrix');
 *     var MouseSync = require('famous-sync/MouseSync');
 *     var Context = Engine.createContext();
 *
 *     var surface = new Surface({
 *         size: [200,200],
 *         properties: {
 *             backgroundColor: 'red'
 *         }
 *     });
 *
 *     var modifier = new Modifier({
 *         transform: undefined
 *     });
 *
 *     var position = 0;
 *     var sync = new MouseSync(function(){
 *         return position;
 *     }, {direction: MouseSync.DIRECTION_Y});  
 *
 *     surface.pipe(sync);
 *     sync.on('update', function(data) {
 *         var edge = window.innerHeight - (surface.getSize()[1])
 *         if (data.p > edge) {
 *             position = edge;
 *         } else if (data.p < 0) {
 *             position = 0;
 *         } else {
 *             position = data.p;
 *         }
 *         modifier.setTransform(FM.translate(0, position, 0));
 *         surface.setContent('position' + position + '<br>' + 'velocity' + data.v.toFixed(2));
 *     });
 *     Context.link(modifier).link(surface);
 * 
 */
function MouseSync(targetGet, options) {
    this.targetGet = targetGet;

    this.options =  {
        direction: undefined,
        rails: false,
        scale: 1,
        stallTime: 50,
        propogate : true           //events piped to document on mouseleave
    };

    if (options) {
        this.setOptions(options);
    } else {
        this.setOptions(this.options);
    }

    this.input = new EventHandler();
    this.output = new EventHandler();

    EventHandler.setInputHandler(this, this.input);
    EventHandler.setOutputHandler(this, this.output);

    this._prevCoord = undefined;
    this._prevTime = undefined;
    this._prevVel = undefined;

    this.input.on('mousedown', _handleStart.bind(this));
    this.input.on('mousemove', _handleMove.bind(this));
    this.input.on('mouseup', _handleEnd.bind(this));

    (this.options.propogate)
        ? this.input.on('mouseleave', _handleLeave.bind(this))
        : this.input.on('mouseleave', _handleEnd.bind(this));
}

/** @const */ MouseSync.DIRECTION_X = 0;
/** @const */ MouseSync.DIRECTION_Y = 1;

function _handleStart(e) {
    e.preventDefault(); // prevent drag
    this._prevCoord = [e.clientX, e.clientY];
    this._prevTime = Date.now();
    this._prevVel = (this.options.direction !== undefined) ? 0 : [0, 0];
    this.output.emit('start' , {ap: this._prevCoord});
};

function _handleMove(e) {
    if(!this._prevCoord) return;

    var prevCoord = this._prevCoord;
    var prevTime = this._prevTime;
    var currCoord = [e.clientX, e.clientY];

    var currTime = Date.now();

    var diffX = currCoord[0] - prevCoord[0];
    var diffY = currCoord[1] - prevCoord[1];

    if(this.options.rails) {
        if(Math.abs(diffX) > Math.abs(diffY)) diffY = 0;
        else diffX = 0;
    }

    var diffTime = Math.max(currTime - prevTime, 8); // minimum tick time

    var velX = diffX / diffTime;
    var velY = diffY / diffTime;

    var prevPos = this.targetGet();
    var scale = this.options.scale;
    var nextPos;
    var nextVel;

    if(this.options.direction == MouseSync.DIRECTION_X) {
        nextPos = prevPos + scale*diffX;
        nextVel = scale*velX;
    }
    else if(this.options.direction == MouseSync.DIRECTION_Y) {
        nextPos = prevPos + scale*diffY;
        nextVel = scale*velY;
    }
    else {
        nextPos = [prevPos[0] + scale*diffX, prevPos[1] + scale*diffY];
        nextVel = [scale*velX, scale*velY];
    }

    this.output.emit('update', {ap: currCoord, p: nextPos, v: nextVel});

    this._prevCoord = currCoord;
    this._prevTime = currTime;
    this._prevVel = nextVel;
};

function _handleEnd(e) {
    if(!this._prevCoord) return;

    var prevTime = this._prevTime;
    var currTime = Date.now();

    if(currTime - prevTime > this.options.stallTime) this._prevVel = (this.options.direction == undefined) ? [0, 0] : 0;

    var pos = this.targetGet();

    this.output.emit('end', {p: pos, v: this._prevVel});

    this._prevCoord = undefined;
    this._prevTime = undefined;
    this._prevVel = undefined;
};

function _handleLeave(e){
    if(!this._prevCoord) return;

    var boundMove = function(e){
        _handleMove.call(this, e);
    }.bind(this);

    var boundEnd = function(e){
        _handleEnd.call(this, e);
        document.removeEventListener('mousemove', boundMove);
        document.removeEventListener('mouseup', boundEnd);
    }.bind(this);

    document.addEventListener('mousemove', boundMove);
    document.addEventListener('mouseup', boundEnd);
};

MouseSync.prototype.getOptions = function() {
    return this.options;
};

MouseSync.prototype.setOptions = function(options) {
    if(options.direction !== undefined) this.options.direction = options.direction;
    if(options.rails !== undefined) this.options.rails = options.rails;
    if(options.scale !== undefined) this.options.scale = options.scale;
    if(options.stallTime !== undefined) this.options.stallTime = options.stallTime;
    if(options.propogate !== undefined) this.options.propogate = options.propogate;
};

module.exports = MouseSync;
