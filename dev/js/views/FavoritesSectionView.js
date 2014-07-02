define(function(require, exports, module) {

    // Import core Famous dependencies
    var View               = require('famous/core/View');
    var Utility            = require('famous/utilities/Utility');
    var Surface            = require('famous/core/Surface');
    var VerticalScrollView = require('custom/VerticalScrollView');
    var Engine             = require('famous/core/Engine');

    var Templates        = require('custom/Templates');
    var FavoriteItemView = require('views/FavoriteItemView');

    function FavoritesSectionView(options) {

        View.call(this);

        this.title = Templates.favoriteHeader();
        this.navigation = {
            caption: 'Favorites',
            icon: '<i class="fa fa-star"></i>'
        };

        this.collection = options.collection;
        this.scrollview = new VerticalScrollView({
            startAt: 'top'
        });
        this.pipe(this.scrollview);

        this._add(this.scrollview);
        this.scrollview.sequenceFrom([]);

        this.collection.on('all', function (e, model, collection, options) {
            switch (e) {
                case 'change:favorite':
                    if (model.changed.favorite)
                        this.addItem(model);
                    else {
                        var i = this.pastCollection.indexOf(model);
                        this.removeItemByIndex(i);
                    }
                    break;
                case 'remove':
                    var i = this.pastCollection.indexOf(model);
                    this.removeItemByIndex(i);
                    break;
                case 'add':
                    this.addItem(model);
                    break;
                // sync is unnecessary, because loadItems() is done at init.
                //            case 'sync':
                //                if (this.firstLoad == undefined) {
                //                    this.loadItems();
                //                    this.firstLoad = true;
                //                }
                //                break;
            }
        }.bind(this));

    }

    FavoritesSectionView.prototype = Object.create(View.prototype);
    FavoritesSectionView.prototype.constructor = FavoritesSectionView;

    FavoritesSectionView.prototype.loadItems = function () {
        this.pastCollection = this.collection.favorites();
        this.sequence = this.collection.favorites().map(function (item) {
            var surface = new FavoriteItemView({model: item});
            surface.pipe(this._eventOutput);
            this._eventInput.pipe(surface);
            return surface;
        }.bind(this));
        this.scrollview.sequenceFrom(this.sequence);
    };

    FavoritesSectionView.prototype.addItem = function (contact) {
        this.pastCollection = this.collection.favorites();
        var i = this.collection.favorites().indexOf(contact);
        if (i >= 0) {
            var surface = new FavoriteItemView({model: contact});
            surface.pipe(this._eventOutput);
            this._eventInput.pipe(surface);
            this.scrollview.addByIndex(i, surface);
        }
    };

    FavoritesSectionView.prototype.removeItemByIndex = function (index) {
        this.pastCollection = this.collection.favorites();
        this.scrollview.removeByIndex(index);
    };

    module.exports = FavoritesSectionView;

});