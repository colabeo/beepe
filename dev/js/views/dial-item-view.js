var View = require('famous/view');
var Surface = require('famous/surface');
var Modifier = require('famous/modifier');
var GenericSync = require('famous/input/generic-sync');
var MouseSync = require('famous/input/mouse-sync');
var TouchSync = require('famous/input/touch-sync');
var Transform = require('famous/transform');
var Easing = require('famous/transitions/easing');
var Transitionable   = require('famous/transitions/transitionable');
var WallTransition   = require('famous/transitions/wall-transition');
var SpringTransition   = require('famous/transitions/spring-transition');
var Engine = require('famous/engine');
var Utility = require('famous/utilities/utility');
var SoundPlayer  = require('famous/audio/sound-player');

var Templates    = require('templates');
var Helpers   = require('helpers');

function DialItemView(options){

    window.bonI = this;
    View.call(this, options);

    _init.call(this);
    _event.call(this);
}

DialItemView.prototype = Object.create(View.prototype);
DialItemView.prototype.constructor = DialItemView;

DialItemView.DEFAULT_OPTIONS = {
    name : undefined,
    abc : undefined,
    buttonSize : 75,
    tone : undefined,
    float: 0.5
};

function _init(){
    var content = (this.options.name.length == 1)?
        Templates.dialNumber(this.options.name, this.options.abc): this.options.name;
    this.numberSurface = new Surface({
        size: [this.options.buttonSize, this.options.buttonSize],
        content: content,
        properties: {
            borderRadius: "10px"
        }
    });
    if (this.options.name != ' ' && this.options.name.length ==1)
        this.numberSurface.addClass('thin-border');

    this.mod = new Modifier({
        origin:[this.options.float,0.5]
    });
    this._add(this.mod).add(this.numberSurface);


    var phonetone;
    if (this.options.name === '*') phonetone = 'star';
    else if (this.options.name === '#') phonetone = 'pound';
    else phonetone = this.options.name;

    this.ringtone = new SoundPlayer([[
        'content/audio/dtmf',phonetone,'.mp3'
    ].join('')]);
}

function _event(){
    this.pos = new Transitionable([0,0]);
    var sync = new GenericSync(function(){
        return this.pos.get();
    }.bind(this), {
            syncClasses:[Helpers.deviceSync()]
        }
    );
    this.numberSurface.pipe(sync);

    sync.on('start', this.pressStart.bind(this));

    sync.on('end', this.pressEnd.bind(this));
}


DialItemView.prototype.pressStart = function() {
    this.pos.set([0,0]);
    setTimeout(function(){
        this.numberSurface.setProperties({backgroundColor: 'rgba(255,255,255,0.1)'});
    }.bind(this),100);
    this.startRingtone();
};

DialItemView.prototype.pressEnd = function() {
    this.stopRingtone();
    setTimeout(function(){
        this.numberSurface.setProperties({backgroundColor: 'transparent'});
    }.bind(this),100);
    this.pressNumber();
};

DialItemView.prototype.press = function() {
    this.pressStart();
    setTimeout(this.pressEnd.bind(this), 300);
};

DialItemView.prototype.startRingtone = function() {
    this.ringtone.playSound(0, 1);
//    this.ringtoneRepeat = setInterval(function(){this.ringtone.playSound(0, 1)}.bind(this), 8000);
};

DialItemView.prototype.stopRingtone = function() {
//    clearInterval(this.ringtoneRepeat);
    this.ringtone.stopPlaying();
};

DialItemView.prototype.pressNumber = function(){
    this._eventOutput.emit('pressNumber', this.options.name);
};

module.exports = DialItemView;

