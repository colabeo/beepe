define(function(require, exports, module) {

    var Templates = require('custom/Templates');
    var RowView   = require('custom/RowView');
    var ItemView  = RowView.ItemView2S;

    function ChatItemView(options) {
        options.leftButtons = [
            {
                content: Templates.crossButton(),
                event: 'deleteItem'
            },
            {
                content: Templates.editButton(),
                event: 'editContact'
            }
        ];
        options.rightButton = {
            content: Templates.phoneButton(),
            event: 'outgoingCall'
        };
        options.itemButton = {
            classes: ['contact-item', 'chat-item'],
            content: Templates.chatItemView(options.model),
            event: 'chatContact'
        };
        options.buttonSizeY = 60;
        options.size = [true, 60];

        ItemView.apply(this, arguments);

        this._eventInput.on('toggleAllChat', this.onToggleAll.bind(this));
        this._eventInput.on('backToNoneEditing', this.setEditingOff.bind(this));

    }

    ChatItemView.prototype = Object.create(ItemView.prototype);
    ChatItemView.prototype.constructor = ChatItemView;

    ChatItemView.prototype.updateItem = function () {
        this.itemSurface.setContent(Templates.chatItemView(this.model));
    };

    module.exports = ChatItemView;

});

