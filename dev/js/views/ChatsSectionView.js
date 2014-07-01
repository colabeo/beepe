// Import core Famous dependencies
var View             = require('famous/view');
var Utility          = require('famous/utilities/utility');
var Surface          = require('famous/surface');
var VerticalScrollView       = require('vertical-scroll-view');
var Engine           = require('famous/engine');

var Templates        = require('templates');
var ChatItemView   = require('chat-item-view');

function ChatsSectionView(options) {

    View.call(this);

    this.title = Templates.chatsHeader();
    this.navigation = {
        caption: 'Messages',
        icon: '<i class="fa fa-comments-o"></i>'
    };

    this.collection = options.collection;
    this.scrollview = new VerticalScrollView({
        startAt: 'top'
    });
    this.pipe(this.scrollview);
    this._add(this.scrollview);
    this.scrollview.sequenceFrom([]);

    this.collection.on('all', function(e, model, collection, options) {
//        console.log('chats ',e);
        switch(e)
        {
            case 'remove':
                var index = options.index;
                console.log(index);
                this.scrollview.removeByIndex(index);
                break;
            case 'add':
                this.addItem(model);
                this.collection.sort();
                this.scrollview.sortBy(function(item){return -1*item.model.get('time')});
                break;
            case 'change':
                this.collection.sort();
                this.scrollview.sortBy(function(item){return -1*item.model.get('time')});
                break;
        }
        this.updateItems();
    }.bind(this));
}

ChatsSectionView.prototype = Object.create(View.prototype);
ChatsSectionView.prototype.constructor = ChatsSectionView;

ChatsSectionView.prototype.updateItems = function() {
    _.each(this.scrollview.node.array, function(itemView){
        if (itemView.updateItem) itemView.updateItem();
    });
};

ChatsSectionView.prototype.loadItems = function() {
//    this.collection.fetch();
    this.scrollview.setPosition(0);
    this.sequence = this.collection.map(function(item){
        var surface = new ChatItemView({
            model: item
        });
        surface.pipe(this._eventOutput);
        this._eventInput.pipe(surface);
        return surface;
    }.bind(this));
    this.scrollview.sequenceFrom(this.sequence);
};

ChatsSectionView.prototype.addItem = function(call) {
    var surface = new ChatItemView({model: call});
    surface.pipe(this._eventOutput);
    this._eventInput.pipe(surface);
    this.scrollview.addByIndex(0, surface);
};

ChatsSectionView.prototype.removeItemByIndex = function(index) {
    this.scrollview.removeByIndex(index);
};

module.exports = ChatsSectionView;
