var FTT = require('famous/input/touch-tracker');
var FEH = require('famous/core/EventHandler');

function TouchSync(targetSync,options) {
    this.targetGet = targetSync;

    this.output = new FEH();
    this.touchTracker = new FTT();

    this.options = {
        direction: undefined,
        rails: false,
        scale: 1
    };

    if (options) {
        this.setOptions(options);
    } else {
        this.setOptions(this.options);
    }

    FEH.setOutputHandler(this, this.output);
    FEH.setInputHandler(this, this.touchTracker);

    this.touchTracker.on('trackstart', _handleStart.bind(this));
    this.touchTracker.on('trackmove', _handleMove.bind(this));
    this.touchTracker.on('trackend', _handleEnd.bind(this));
}

/** @const */ TouchSync.DIRECTION_X = 0;
/** @const */ TouchSync.DIRECTION_Y = 1;

function _handleStart(data) {
    this.output.emit('start', {ap: [data.touch.clientX, data.touch.clientY], count: data.count, touch: data.touch.identifier});
};

function _handleMove(data) {
    var history = data.history;
    var prevTime = history[history.length - 2].timestamp;
    var currTime = history[history.length - 1].timestamp;
    var prevTouch = history[history.length - 2].touch;
    var currTouch = history[history.length - 1].touch;

    var diffX = currTouch.pageX - prevTouch.pageX;
    var diffY = currTouch.pageY - prevTouch.pageY;
    
    if(this.options.rails) {
        if(Math.abs(diffX) > Math.abs(diffY)) diffY = 0;
        else diffX = 0;
    }

    var diffTime = Math.max(currTime - prevTime, 8); // minimum tick time

    var velX = diffX / diffTime;
    var velY = diffY / diffTime;

    //DV edits to send acceleration and velocity
    if (history.length > 2){
        var prevprevTouch = history[history.length - 3].touch;
        var accelX = (currTouch.pageX - 2*prevTouch.pageX + prevprevTouch.pageX) / (diffTime*diffTime);
        var accelY = (currTouch.pageY - 2*prevTouch.pageY + prevprevTouch.pageY) / (diffTime*diffTime);
    }
    else{
        var accelX = 0;
        var accelY = 0;
    }

    var prevPos = this.targetGet();
    var scale = this.options.scale;
    var nextPos;
    var nextVel;
    var nextAccel;
    if(this.options.direction == TouchSync.DIRECTION_X) {
        nextPos = prevPos + scale*diffX;
        nextVel = scale*velX;
        nextAccel = scale*velY;
    }
    else if(this.options.direction == TouchSync.DIRECTION_Y) {
        nextPos = prevPos + scale*diffY;
        nextVel = scale*velY;
        nextAccel = scale*accelY;
    }
    else {
        nextPos = [prevPos[0] + scale*diffX, prevPos[1] + scale*diffY];
        nextVel = [scale*velX, scale*velY];
        nextAccel = [scale*accelX, scale*accelY];
    }

    this.output.emit('update', {
        ap: [currTouch.pageX, currTouch.pageY],
        p: nextPos,
        v: nextVel,
        a: nextAccel,
        touch: data.touch.identifier
    });
};

function _handleEnd(data) {
    var nextVel = (this.options.direction !== undefined) ? 0 : [0, 0];
    var history = data.history;
    var count = data.count;
    var pos = this.targetGet();
    if(history.length > 1) {
        var prevTime = history[history.length - 2].timestamp;
        var currTime = history[history.length - 1].timestamp;
        var prevTouch = history[history.length - 2].touch;
        var currTouch = history[history.length - 1].touch;
        var diffX = currTouch.pageX - prevTouch.pageX;
        var diffY = currTouch.pageY - prevTouch.pageY;

        if(this.options.rails) {
            if(Math.abs(diffX) > Math.abs(diffY)) diffY = 0;
            else diffX = 0;
        }

        var diffTime = Math.max(currTime - prevTime, 1); // minimum tick time
        var velX = diffX / diffTime;
        var velY = diffY / diffTime;
        var scale = this.options.scale;

        var nextVel;
        if(this.options.direction == TouchSync.DIRECTION_X) nextVel = scale*velX;
        else if(this.options.direction == TouchSync.DIRECTION_Y) nextVel = scale*velY;
        else nextVel = [scale*velX, scale*velY];
    }
    this.output.emit('end', {p: pos, v: nextVel, count: count, touch: data.touch.identifier});
};

TouchSync.prototype.setOptions = function(options) {
    if(options.direction !== undefined) this.options.direction = options.direction;
    if(options.rails !== undefined) this.options.rails = options.rails;
    if(options.scale !== undefined) this.options.scale = options.scale;
};

TouchSync.prototype.getOptions = function() {
    return this.options;
};

module.exports = TouchSync;
