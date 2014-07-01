var View         = require('famous/view');
var Transform    = require('famous/transform');
var Surface      = require('famous/surface');
var EventHandler = require('famous/core/EventHandler');
var Easing       = require('famous/transitions/easing');
var SoundPlayer  = require('famous/audio/sound-player');

var LightBox  = require('light-box');
var Templates = require('templates');

var Models  = require("models");
var Contact = Models.Contact;
var Call    = Models.Call;

var duration = 500;

function IncomingCallView(options) {
    View.call(this);
    this.collection = options.collection;

    // Set up event handlers
    // this.eventInput = new EventHandler();
    // EventHandler.setInputHandler(this, this.eventInput);
    // this.eventOutput = new EventHandler();
    // EventHandler.setOutputHandler(this, this.eventOutput);

    this.headerLightBox = new LightBox({
        inTransition:false,
        outTransition:false,
        showOrigin: [0.5, 0.1]
    });

    this.footerLightBox = new LightBox({
        inTransform: Transform.translate(0, 900, 0),
        inTransition: {duration: duration, curve: Easing.inQuad()},
        inOpacity: 0,
        inOrigin: [0.5, 0.5],
        outTransform: Transform.translate(0, 900, 0),
        outOpacity: 0,
        outOrigin: [0.5, 0.5],
        outTransition: {duration:duration, curve: Easing.outQuad()},
        showTransform: Transform.identity,
        showOpacity: 1,
        showOrigin: [0.5, 0.9]
    });

    this.header = new Surface({
        classes:['outgoing-call-view'],
        size: [undefined, 300],
        _origin:[0.5,-0.5],
        properties: {
            backgroundColor: 'transparent'
        }
    });

    var declineButton = Templates.button({
        classes:["decline-button", "big-button"],
        checked:true,
        content:'Decline',
        size:[160,70]
    })
    var answerButton = Templates.button({
        classes:["answer-button", "big-button"],
        checked:true,
        content:'Answer',
        size:[160,70]
    })

    this.footer = new Surface({
        classes: ['incoming-call-view-buttons'],
        size: [undefined, 80],
        properties: {
            backgroundColor: 'transparent'
        },
        content: '<div class="box">' + declineButton + answerButton + '</div>'
    });

    this._add(this.headerLightBox);
    this._add(this.footerLightBox);

    _.bindAll(this, 'template');
    this.collection.bind('add', this.template);

    this.ringtone = new SoundPlayer([
        'content/audio/ringtone.mp3'
    ]);

    this.footer.on('click', function(e) {
        var target = $(e.target);
        if (target.hasClass("decline-button")) {
            this.stop(target);
        }
        else if (target.hasClass("answer-button")) {
            this.accept();
        }
    }.bind(this));

    this._eventInput.on('incomingCall', function() {
//            console.log("incomingCall");
    });
    this._eventInput.on('incomingCallAnswerClick', function() {
        this.accept();
    }.bind(this));
}

IncomingCallView.prototype = Object.create(View.prototype);
IncomingCallView.prototype.constructor = IncomingCallView;

IncomingCallView.prototype.template = function() {
    this.model = this.collection.models[0] || new Call();
    var html = '<div class="box">';

    html += '<div class="caller-name">' + this.model.get('firstname') + " " + this.model.get('lastname') + "</div>";

    if (this.model.get('pictureUrl'))
        html += '<img class="caller-picture" src="' + this.model.get('pictureUrl') + '"></img>';
    else {
        var initial = this.model.get('firstname')[0] + this.model.get('lastname')[0];
        html += '<div class="initial">'+initial+'</div>';
    }

    html += '<div class="caller-info"></div>';

    this.header.setContent(html);
};

IncomingCallView.prototype.startRingtone = function() {
    this.ringtone.playSound(0, 1);
    this.ringtoneRepeat = setInterval(function(){this.ringtone.playSound(0, 1)}.bind(this), 8000);
    this.footerLightBox.show(this.footer);
    this.headerLightBox.show(this.header);
};

IncomingCallView.prototype.stopRingtone = function() {
    clearInterval(this.ringtoneRepeat);
    this.ringtone.stopPlaying();
};

IncomingCallView.prototype.start = function(eventData) {
    this.on = true;
    var data;
    if (eventData instanceof Contact || eventData instanceof Call) {
        data = eventData.attributes;
    } else {
        this.model = this.collection.models[0] || new Call();
        data = this.model.attributes;
    }
    this.model.set({roomId: data.roomId});
    this.startRingtone();
    $('.camera').removeClass('blur');
}

IncomingCallView.prototype.stop = function(button) {
    if (!this.on) return;
    this.on = false;
    if (button) {
        this.model.set({
            success: false
        });
        button.addClass('exiting');
    }
    this.stopRingtone();
    setTimeout(function() {
        this.footerLightBox.hide();
        this.headerLightBox.hide();
        this._eventOutput.emit('showApp', function(){
            if (button) button.removeClass('exiting');
        });
    }.bind(this), duration);
    /* decline shouldn't remove the call
    if (button) {
        this.eventOutput.emit('incomingCallEnd', this.model);
    }
    */
};

IncomingCallView.prototype.accept = function() {
    var button = $('.answer-button');
    this.on = false;
    this.model.set({
        success: true
    });
    if (button) button.addClass('exiting');
    this.stopRingtone();
    setTimeout(function() {
        this.footerLightBox.hide();
        this.headerLightBox.hide();
        setTimeout(function(){
            if (button) button.removeClass('exiting');
        }, 1000);
        this._eventOutput.emit('connectedCall', this.model);
    }.bind(this), duration);
    if (button) {
        this._eventOutput.emit('incomingCallAnswer', this.model);
    }
};

module.exports = IncomingCallView;
