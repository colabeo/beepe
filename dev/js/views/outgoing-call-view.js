var View         = require('famous/view');
var Transform    = require('famous/transform');
var Surface      = require('famous/surface');
var EventHandler = require('famous/event-handler');
var Easing       = require('famous/transitions/easing');
var SoundPlayer  = require('famous/audio/sound-player');

var LightBox  = require('light-box');
var Templates = require('templates');

var Models  = require("models");
var Contact = Models.Contact;
var Call    = Models.Call;

var duration = 500;

function OutgoingCallView(options){

    View.call(this);
    this.collection = options.collection;

    this.headerLightBox = new LightBox({
        inTransition:false,
        outTransition:false,
        showOrigin: [0.5, 0.1],
        overlap:true
    });

    this.footerLightBox = new LightBox({
        inTransform: Transform.translate(0, 900, 0),
        inTransition: {duration: duration, curve: Easing.inQuad()},
        inOpacity: 0,
        inOrigin: [0.5, 0.5],
        outTransform: Transform.translate(0, 900, 0),
        outOpacity: 0,
        outOrigin: [0.5, 0.5],
        outTransition: {duration: duration, curve: Easing.outQuad()},
        showTransform: Transform.identity,
        showOpacity: 1,
        showOrigin: [0.5, 0.9],
        overlap:true
    });

    // Set up event handlers
    // this.eventInput = new EventHandler();
    // EventHandler.setInputHandler(this, this.eventInput);
    // this.eventOutput = new EventHandler();
    // EventHandler.setOutputHandler(this, this.eventOutput);


    this.header = new Surface({
        classes:['outgoing-call-view'],
        size: [undefined, 300],
        _origin:[0.5,-0.5],
        properties: {
            backgroundColor: 'transparent'
        }
    });

    this.footer = new Surface({
        classes: ['outgoing-call-view-buttons'],
        size: [undefined, 80],
        properties: {
            backgroundColor: 'transparent'
        }
    });

    this._add(this.headerLightBox);
    this._add(this.footerLightBox);

    _.bindAll(this, 'template');
    this.collection.bind('add', this.template);

    this.calltone = new SoundPlayer([
        'content/audio/calltone.mp3',
        'content/audio/ringtone.mp3'
    ]);

    this.footer.on('click', function(e) {
        var target = $(e.target);
        if (target.hasClass("end-button")) {
            this.stop(target);
        }
    }.bind(this));

    this.header.on('click', function(e){
        var target = $(e.target);
        if (target.hasClass("touchable")) {
            this._eventOutput.emit('outgoingPhoneCall',this.model);
        }
    }.bind(this));
}


OutgoingCallView.prototype = Object.create(View.prototype);
OutgoingCallView.prototype.constructor = OutgoingCallView;

OutgoingCallView.prototype.setPhoneOnly = function() {
    $('.caller-info').removeClass('touchable').addClass('phone-only');
}

OutgoingCallView.prototype.template = function() {
    this.model = this.collection.models[0];
    var html = '<div class="box">';

    html += '<div class="caller-name">' + this.model.get('firstname') + " " + this.model.get('lastname') + "</div>";

    if (this.model.get('pictureUrl'))
        html += '<img class="caller-picture" src="' + this.model.get('pictureUrl') + '"></img>';
    else {
        var initial = this.model.get('firstname')[0] + this.model.get('lastname')[0];
        html += '<div class="initial">'+initial+'</div>';
    }
    if (this.model.get('phone')) {
        var phoneNumber = this.model.get('phone');
        html += '<div class="caller-info ';
        html += 'touchable';
        html += '">' +
            '<i class="fa fa-phone"></i> '
            + phoneNumber[0] + '(' + phoneNumber.slice(1,4) + ') ' + phoneNumber.slice(4,7) + '-' + phoneNumber.slice(7,11)
            + '</div>';
    }

//    html += '<div class="caller-info"></div>';

    this.header.setContent(html);

    var videoButton = Templates.toggleButton({
        id: 'video',
        classes: ["video-button", "big-button"],
        checked: this.appSettings?this.appSettings.get('video'):true,
        onContent: '<i class="fa fa-eye fa-lg on"></i>',
        offContent: '<i class="fa fa-eye-slash fa-lg off"></i>',
        onBackgroundColor: '#dadbd9',
        offBackgroundColor: '#dadbd9',
        size: [70,70]
    });
    var endButton = Templates.button({
        classes: ["end-button", "big-button"],
        checked: true,
        content: 'End',
        size: [160,70]
    });
    var audioButton = Templates.toggleButton({
        id: 'audio',
        classes:["audio-button", "big-button"],
        checked: this.appSettings?this.appSettings.get('audio'):true,
        onContent: '<i class="fa fa-microphone fa-lg on"></i>',
        offContent: '<i class="fa fa-microphone-slash fa-lg off"></i>',
        onBackgroundColor: '#dadbd9',
        offBackgroundColor: '#dadbd9',
        size: [70,70]
    });

    html = '<div class="box">' + videoButton + endButton + audioButton + '</div>'
    this.footer.setContent(html);
};

OutgoingCallView.prototype.startCalltone = function(silent) {
    if (!silent) {
        this.calltone.playSound(0, 1);
        this.calltoneRepeat = setInterval(function(){this.calltone.playSound(0, 1)}.bind(this), 2500);
    }
    this.footerLightBox.show(this.footer);
    this.headerLightBox.show(this.header);
};

OutgoingCallView.prototype.stopCalltone = function() {
    clearInterval(this.calltoneRepeat);
    this.calltone.stopPlaying();
};

OutgoingCallView.prototype.start = function(eventData, appSettings) {
    this.appSettings = appSettings;
    this.on = true;
    var data;
    if (eventData instanceof Contact || eventData instanceof Call) {
        data = eventData;
    } else {
        this.model = this.collection.models[0] || new Call();
        data = this.model;
    }
    // TODO: extend data
    var newCall = {
        firstname: data.get('firstname'),
        lastname: data.get('lastname'),
        email: data.get('email'),
        phone: data.get('phone'),
//        facebook: data.get('facebook'),
        pictureUrl: false,
        type: 'outgoing',
        time: Date.now(),
        cid: data.get('cid')
    };
    this.collection.create(newCall);
//    var silentCalltone = !isNaN(data.get('phone')) && data.get('phone').length==11;
    this.startCalltone();
    $('.camera').removeClass('blur');
}

OutgoingCallView.prototype.stop = function(button) {
    if (!this.on) return;
    this.on = false;

    if (button) {
        this.model.set({
            success: false
        });
        button.addClass('exiting');
    }
    this.stopCalltone();
    setTimeout(function() {
        this.footerLightBox.hide();
        this.headerLightBox.hide();
        this._eventOutput.emit('showApp', function(){
            if (button) button.removeClass('exiting');
        });
    }.bind(this), duration);
    if (button) {
        this._eventOutput.emit('outgoingCallEnd', this.model);
    }
};

OutgoingCallView.prototype.accept = function(call) {
    this.on = false;
    this.model.set({
        success: true
    });
    this.stopCalltone();
    setTimeout(function() {
        this.footerLightBox.hide();
        this.headerLightBox.hide();
        this._eventOutput.emit('connectedCall', this.model);
    }.bind(this), duration);
};

module.exports = OutgoingCallView;
