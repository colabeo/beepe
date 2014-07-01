var Templates    = require('templates');
var RowView    = require('row-view');
var ItemView = RowView.ItemView2S;

function RecentItemView(options){
    options.leftButtons =[{
        content: Templates.crossButton(),
        event: 'deleteItem'
    },
    {
        content: Templates.editButton(),
        event: 'editContact'
    }];
    options.rightButton ={
        content: Templates.phoneButton(),
        event: 'outgoingCall'
    };
    options.itemButton = {
        classes: ['contact-item', 'recent-item'],
        content: Templates.recentItemView(options.model),
        event: 'chatContact'
    };

    ItemView.apply(this, arguments);

    this._eventInput.on('toggleAllRecent', this.onToggleAll.bind(this));
    this._eventInput.on('backToNoneEditing', this.setEditingOff.bind(this));

}

RecentItemView.prototype = Object.create(ItemView.prototype);
RecentItemView.prototype.constructor = RecentItemView;

RecentItemView.prototype.updateItem = function(){
    this.itemSurface.setContent(Templates.recentItemView(this.model));
};

module.exports = RecentItemView;

