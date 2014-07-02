define(function(require, exports, module) {

    var View         = require('famous/core/View');
    var Transform    = require('famous/core/Transform');
    var Surface      = require('famous/core/Surface');
    var EventHandler = require('famous/core/EventHandler');

    var Templates    = require('custom/Templates');

    var Call         = require("models").Call;
    var ConversationView = require('views/ConversationView');

    var duration = 500;

    function ConnectedCallView(options) {

        View.call(this);
        this.collection = options.collection;

        this._eventOutput.on('menu-toggle-button', this.onMenuToggleButton);

        this.conversationView = new ConversationView();
        this.conversationView.pipe(this._eventOutput);
        this._eventInput.pipe(this.conversationView);
        this._add(this.conversationView);
    }

    ConnectedCallView.prototype = Object.create(View.prototype);
    ConnectedCallView.prototype.constructor = ConnectedCallView;

    ConnectedCallView.prototype.start = function (appSetting, call) {
        this.conversationView.start(appSetting, call);
        this.model = this.collection.models[0] || new Call();
        this.appSettings = appSetting;
        $('.camera').removeClass('blur');
    };

    ConnectedCallView.prototype.stop = function (evt) {
        this._eventOutput.emit('outgoingCallEnd', this.model);
        this._eventOutput.emit('incomingCallEnd', this.model);
        if (evt.exit) {
            this._eventOutput.emit('showApp');
        }
        this.conversationView.stop(evt);
    };

    module.exports = ConnectedCallView;

});
