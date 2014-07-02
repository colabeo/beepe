define(function(require, exports, module) {

    var Templates = require('custom/Templates');
    var RowView   = require('custom/RowView');
    var ItemView  = RowView.ItemView;

    function FavoriteItemView(options) {
        options.leftButtons = [
            {
                content: Templates.crossButton(),
                event: 'deleteFavorite'
            }
        ];
        options.rightButton = {
            content: Templates.phoneButton(),
            event: 'outgoingCall'
        };
        options.itemButton = {
            classes: ['contact-item', 'favorite-item', 'recent-item', 'editable'],
            content: Templates.favoriteItemView(options.model),
            event: 'editContact'
        };

        ItemView.apply(this, arguments);

        this._eventInput.on('toggleAllFavorite', this.onToggleAll.bind(this));
        this._eventInput.on('backToNoneEditing', this.setEditingOff.bind(this));
    }

    FavoriteItemView.prototype = Object.create(ItemView.prototype);
    FavoriteItemView.prototype.constructor = FavoriteItemView;

    module.exports = FavoriteItemView;

});