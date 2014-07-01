// import famous modules
var View         = require('famous/view');
var EventHandler = require('famous/core/EventHandler');
var Modifier     = require("famous/modifier");

// Import app specific dependencies
var ConversationSurface = require('conversation-surface');

var Helpers = require('helpers');

function ConversationItemView(options){
    View.call(this);

    this.model = options.model;

    // this.eventInput = new EventHandler();
    // EventHandler.setInputHandler(this, this.eventInput);
    // this.eventOutput = new EventHandler();
    // EventHandler.setOutputHandler(this, this.eventOutput);

    this.surface = new ConversationSurface({
        properties:{
            maxWidth: 300,
            zIndex: 2
        }
    });

    this.template();
    this.event();
    this.surface.pipe(this._eventOutput);
    this._add(this.surface);
}

ConversationItemView.prototype = Object.create(View.prototype);
ConversationItemView.prototype.constructor = ConversationItemView;

ConversationItemView.prototype.event = function(){
    this.surface.on('click',function(e){
        if ($(e.target).hasClass('conversation-item')) return;
        this._eventOutput.emit('toggleMsg');
    }.bind(this));
};

ConversationItemView.prototype.template = function(){
    var content = this.getLink(this.model.get('content'));
    if (this.model.isLocal()) {
        content = '<div class="conversation-item triangle-border right">' + content + '</div>';
    }
    else
        content = '<div class="conversation-item triangle-border left">' + content + '</div>';
    this.surface.setContent(content);
};

ConversationItemView.prototype.getLink = function(message){
    return Helpers.linkify(message);
};

module.exports = ConversationItemView;
