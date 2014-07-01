// Import core Famous dependencies
var View = require('famous/view');
var Surface = require('famous/surface');
var Modifier = require('famous/modifier');
var Transform          = require('famous/transform');
var Scrollview = require('famous/views/scrollview');
var Utility = require('famous/utilities/utility');
var HeaderFooterLayout = require('famous/views/header-footer-layout');
var Engine = require('famous/engine');
var SoundPlayer  = require('famous/audio/sound-player');
var Transitionable   = require('famous/transitions/transitionable');
var WallTransition   = require('famous/transitions/wall-transition');
Transitionable.registerMethod('wall', WallTransition);

var Templates    = require('templates');
var VerticalScrollView       = require('vertical-scroll-view');
var ConversationItemView   = require('conversation-item-view');

var ConversationCollection = require('models').ConversationCollection;
var ChatCollection = require('models').ChatCollection;
var Settings = require('models').Settings;

var Helpers = require('helpers');

var startOpacity = 0.0001;

function ConversationView(appSettings, call) {
    View.call(this);
    this.setupBeepeTone();
    this.initHeader();
    this.initFooter();
    this.initConversation();
    this.setupLayout();
    this.setupTransition();
    this.onResize();
    this.buttonsEvents();
    this.textingEvents();
    // TODO: hack, for Dev;
    this.inputSourceLocal=true;
}

ConversationView.prototype = Object.create(View.prototype);
ConversationView.prototype.constructor = ConversationView;

ConversationView.prototype.setupBeepeTone = function(){
    this.messageTone = new SoundPlayer([
        'content/audio/beep.mp3'
    ]);
    this.playBeepe = _.debounce(function(){
        this.messageTone.playSound(0, 0.3);
    }.bind(this), 300);
};

ConversationView.prototype.setupcall = function(appSettings,call){
    this.appSettings = appSettings;

    var onSetVideo = function(){this._eventOutput.emit('setVideo')}.bind(this);
    var onSetAudio = function(){this._eventOutput.emit('setAudio')}.bind(this);

    this.settingsEvents = {
        'change:video': onSetVideo,
        'change:audio': onSetAudio
    };
    this.appSettings.on(this.settingsEvents);

    this.call = call;
    
    if (!Helpers.isDev()) {
        if (this.collection) this.collection.off();
        var url = appSettings.get('firebaseUrl') + 'chats/' + appSettings.get('cid')+ '/' + call.get('cid');
        this.collection = new ChatCollection([], {
            firebase: url
        });
    } else {
        this.collection = new ConversationCollection();
        this.call = undefined;
    }
    this.synced = false;
};

ConversationView.prototype.initHeader = function(){
    this.exitSurface = new Surface({
        size:[window.innerWidth - 225, 50],
        classes:["conversation-exit"],
        properties:{
            cursor: "pointer"
        }
    });
    this.exitSurface.pipe(this._eventOutput);
    this.exitSurfaceMod = new Modifier({
        transform:Transform.translate(0,0,3)
    });

    this.callSurface = new Surface({
        size:[225, 50],
        classes:["conversation-call"],
        content:'<div class="touchable"><i class="fa fa-phone fa-lg"></i> Call</div>',
        properties:{
            cursor: "pointer"
        }
    });
    this.callSurfaceMod = new Modifier({
        origin:[1,0],
        transform: Transform.translate(0,0,4)
    });

    this.endCallSurface = new Surface({
        size:[75, 50],
        classes:['conversation-endCall'],
        content: '<div class="touchable"><i class="fa fa-phone fa-lg"></i></div>',
        properties:{
            cursor: "pointer"
        }
    });
    this.endCallSurface.pipe(this._eventOutput);
    this.endCallSurfaceMod = new Modifier({
        origin:[1,0],
        transform: Transform.translate(-150,0,3)
    }); 
    
    this.audioSurface = new Surface({
        size:[75, 50],
        classes:['conversation-audio'],
        properties:{
            cursor: "pointer"
        }
    });
    this.audioSurface.pipe(this._eventOutput);
    this.audioSurfaceMod = new Modifier({
        origin:[1,0],
        transform: Transform.translate(0,0,3)
    });

    this.cameraSurface = new Surface({
        size:[75, 50],
        classes:['conversation-camera'],
        properties:{
            cursor: "pointer"
        }
    });
    this.cameraSurfaceMod = new Modifier({
        origin:[1,0],
        transform: Transform.translate(-75,0,3)
    });
};

ConversationView.prototype.cameraSurfaceSetContent = function(){
    if (this.appSettings.attributes.video == true) {
        this.cameraSurface.setContent('<button class="fa fa-video-camera fa-lg on touchable"></button>');
    } else {
        this.cameraSurface.setContent('<button class="fa fa-video-camera fa-lg off touchable"></button>');
    }
};
ConversationView.prototype.audioSurfaceSetContent = function(){
    if (this.appSettings.attributes.audio == true) {
        this.audioSurface.setContent('<button class="fa fa-microphone fa-lg on touchable"></button>');
    } else {
        this.audioSurface.setContent('<button class="fa fa-microphone fa-lg off touchable"></button>');
    }
};

ConversationView.prototype.initFooter = function(){
    this.inputSurface = new Surface({
        size:[window.innerWidth - 100, 50],
        classes:['conversation-input-bar'],
        content: '<textarea class="input-msg" name="message"></textarea>',
        properties:{
            backgroundColor: "black"
        }
    });
    this.inputSurfaceMod = new Modifier({
        transform:Transform.translate(0,0,9)
    });

    this.sendSurface = new Surface({
        size:[100, 50],
        classes:['conversation-input-bar'],
        content: '<div class="touchable"><button class="send-text-button">Send</button></div>',
        properties:{
            backgroundColor: "black",
            cursor: "pointer"
        }
    });
    this.sendSurfaceMod = new Modifier({
        origin:[1,0],
        transform:Transform.translate(0,0,9)
    });
};

ConversationView.prototype.initConversation = function(){
    this.scrollview = new VerticalScrollView({
        startAt:'bottom',
        direction:Utility.Direction.Y
    });
    this.pipe(this.scrollview);
    this.mod = new Modifier({
        opacity: startOpacity
    });
};

ConversationView.prototype.setupLayout = function(){
    this.headerFooterLayout = new HeaderFooterLayout({
        headerSize:50,
        footerSize:50
    });

    this.headerFooterLayout.id.header.add(this.exitSurfaceMod).add(this.exitSurface);
    this.headerFooterLayout.id.header.add(this.callSurfaceMod).add(this.callSurface);
    this.headerFooterLayout.id.header.add(this.endCallSurfaceMod).add(this.endCallSurface);
    this.headerFooterLayout.id.header.add(this.audioSurfaceMod).add(this.audioSurface);
    this.headerFooterLayout.id.header.add(this.cameraSurfaceMod).add(this.cameraSurface);
    this.headerFooterLayout.id.content.add(this.mod).add(this.scrollview);
    this.headerFooterLayout.id.footer.add(this.inputSurfaceMod).add(this.inputSurface);
    this.headerFooterLayout.id.footer.add(this.sendSurfaceMod).add(this.sendSurface);

    this._add(this.headerFooterLayout);
};

ConversationView.prototype.onResize = function(){
    var resizeTimeout;
    var onResize = function() {
        if (!this.scrollview) return;
        // just in case horizontal resize from wide to narrow
//        if (!Helpers.isMobile())
        this.scrollview.setVelocity(-99);
//        this.loadMsg();
    };
//        Engine.on('resize', onResize.bind(this));
    Engine.on('resize', function(){
//            if (Helpers.isMobile()) return;
        this.exitSurface.setSize([window.innerWidth-225,50]);
        this.inputSurface.setSize([window.innerWidth-100,50]);
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(onResize.bind(this), 300);
    }.bind(this));
};

ConversationView.prototype.setupTransition = function(){
    this.buttonTransition = {
        method: 'wall',
        period: 200,
        dampingRatio: 1
    };
    this.chatOpacityTransition = {
        method: 'wall',
        period: 300,
        dampingRatio: 1
    }
};

ConversationView.prototype.start = function(appSettings, call){
    this.setupcall(appSettings,call);
    this.cameraSurfaceSetContent();
    this.audioSurfaceSetContent();
    this.exitSurface.setContent(Templates.conversationViewHeader(call));

    if (!Helpers.isDev() && this.call.get('success')) {
        this.hideCallButton();
    } else
        this.showCallButton();

    this.scrollview.sequenceFrom([]);
    this.collectionEvents();
    if (this.collection.size()) {
        // if locally loaded, then load right away
        setTimeout(this.loadMsg.bind(this), 400);
    }
    if (Helpers.isMobile()) window._disableResize = false;
};

ConversationView.prototype.stop = function(evt){
    this.showCallButton();
    this.appSettings.save({video : true});
    this.appSettings.save({audio : true});
    if (evt.exit) {
        this.collection.off();
        this.appSettings.off(this.settingsEvents);
        if (Helpers.isMobile()) {
            setTimeout(function() {
                window._disableResize = true;
            }, 500);
        }
    }
    if (evt.exit) this.mod.setOpacity(startOpacity);
};

ConversationView.prototype.collectionEvents = function(){
    this.collection.on('all', function(e,model,collection,options){
//        console.log(e);
        switch(e){
            case 'add':
                if (!this.synced) break;
                this.addMsg(model);
                this.playBeepe();
                // only keep at most 100 messages
                while (this.collection.size()>=100) {
                    this.collection.shift();
                }
                setTimeout(function(){this.scrollview.scrollToEnd()}.bind(this),400);
                this.showConversation();
                this._eventOutput.emit('chatRead',this.call);
                break;
            case 'sync':
                setTimeout(this.loadMsg.bind(this), 400);
                this._eventOutput.emit('chatRead',this.call);
                break;
        }
    }.bind(this));
};

ConversationView.prototype.showCallButton = function(){
    this.callSurfaceMod.setTransform(Transform.translate(0,0,4), this.buttonTransition);
};
ConversationView.prototype.hideCallButton = function(){
    this.callSurfaceMod.setTransform(Transform.translate(225,0,4), this.buttonTransition);
};

ConversationView.prototype.buttonsEvents = function(){
    this.exitSurface.on('click', function(){
        this.showCallButton();
        setTimeout(function() {this._eventOutput.emit('callEnd', {exit:true, chat: this.call});}.bind(this), 600);
    }.bind(this));

    this.callSurface.on('click', function(){
        this.hideCallButton();
        setTimeout(function() {this._eventOutput.emit('outgoingCall',this.call);}.bind(this), 600);
    }.bind(this));

    this.endCallSurface.on('click', function(){
        this.showCallButton();
        setTimeout(function() {this._eventOutput.emit('callEnd', {exit:false});}.bind(this), 600);
    }.bind(this));

    this.audioSurface.on('click', function(){
        this.appSettings.save({audio : !this.appSettings.attributes.audio});
        this.audioSurfaceSetContent();
    }.bind(this));
    
    this.cameraSurface.on('click', function(){
        this.appSettings.save({video : !this.appSettings.attributes.video});
        this.cameraSurfaceSetContent();
    }.bind(this));

    this.sendSurface.on('click', function(){
        this.addChat();
    }.bind(this));
};

ConversationView.prototype.textingEvents = function(){
    this.inputSurface.on('keydown', function(e){
        if (e.keyCode == 13){
            this.addChat();
        }
    }.bind(this));

    this._eventInput.on('incomingChat', function(evt){
        this.addRemote(evt.content);
    }.bind(this));

    this._eventOutput.on('toggleMsg',function(){
        // TODO: no toggle for now
//        return;
        if(this.mod.getOpacity() == 1) this.mod.setOpacity(startOpacity, this.chatOpacityTransition);
        else this.mod.setOpacity(1, this.chatOpacityTransition);
    }.bind(this));
};
ConversationView.prototype.createMsgItem = function(model){
    var surface = new ConversationItemView({model:model});
    surface.pipe(this._eventOutput);
    return surface;
};

ConversationView.prototype.addChat = function(){
    var message = document.getElementsByClassName('input-msg')[0].value;
    if (!message || message.replace(/[\s\t\r\n]/g,'') == '') return;
    document.getElementsByClassName('input-msg')[0].value = "";
    if (this.call) {
        // TODO: this is for testing
        if (Helpers.isDev()) return;
        this._eventOutput.emit('sendChat', {contact: this.call, message: message});
    } else {
        // TODO: this is for testing
        this.inputSourceLocal = !this.inputSourceLocal;
        if (this.inputSourceLocal) this.addLocal(message);
        else this.addRemote(message);
    }
};

ConversationView.prototype.addLocal = function(message){
    var appSettings = Settings.getAppSettings();
    var cid = appSettings.get('cid'); // window._cola_g.cid;
    var newMsg = {
        content:message,
        source:'local',
        type:'text',
        from: cid,
        time:Date.now()
    };
    if (Helpers.isDev()) {
        this.collection.create(newMsg);
        return;
    }
    this.collection.add(newMsg);
    this._eventOutput.emit('outgoingChat', newMsg);
};

ConversationView.prototype.addRemote = function(message){
    var newMsg = {
        content: message,
        source: 'remote',
        type: 'text',
        time: Date.now()
    };
    if (Helpers.isDev()) {
        this.collection.create(newMsg);
        return;
    }
    this.collection.add(newMsg);
};

ConversationView.prototype.showConversation = function (){
    this.mod.setOpacity(1, this.chatOpacityTransition);
};

ConversationView.prototype.addMsg = function(model){
    this.scrollview.push(this.createMsgItem(model));
};

ConversationView.prototype.loadMsg = function(){
    this.synced = true;
    var sequence = this.collection.map(function(item){
        return this.createMsgItem(item);
    }.bind(this));
    this.scrollview.sequenceFrom(sequence);
    setTimeout(function(){
        this.scrollview.jumpToEnd();
        setTimeout(function(){
            this.mod.setOpacity(1)
        }.bind(this),400);
    }.bind(this),400);

};

module.exports = ConversationView;
