var Templates    = require('templates');
var RowView    = require('row-view');
var ItemView = RowView.ItemView2S;

function ContactItemView(options) {

    this.model = options.model;
    options.paddingRight = 40;

    options.leftButtons =[{
        content: Templates.crossButton(),
        event: 'deleteItem'
    },
    {
        content: Templates.editButton(),
        event: 'editContact'
    }
//    {
//        content: Templates.favoriteButton(this.model.get('favorite')),
//        event: 'toggleFavorite'
//    }
    ];
    options.rightButton ={
        content: Templates.phoneButton(),
        event: 'outgoingCall'
    };
    options.itemButton = {
        classes: ['contact-item', 'editable'],
        content: Templates.contactItemView(options.model),
//        event: 'editContact'
        event: 'chatContact'
    };

    ItemView.apply(this, arguments);

    this.model.on('all', function(e, model, collection, options) {
        switch(e)
        {
            case 'change:favorite':
                $(this['leftButton1']._currTarget).find('.favorite-button').toggleClass('active');
                break;
        }
    }.bind(this));

    this._eventInput.on('toggleAllContact', this.onToggleAll.bind(this));
    this._eventInput.on('backToNoneEditing', this.setEditingOff.bind(this));
    this.model.on('change', function(){this.changeItem()}.bind(this));
}

ContactItemView.prototype = Object.create(ItemView.prototype);
ContactItemView.prototype.constructor = ContactItemView;

ContactItemView.prototype.changeItem = function(){
    this.itemSurface.setContent(Templates.contactItemView(this.model))
};

module.exports = ContactItemView;
