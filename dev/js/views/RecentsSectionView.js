define(function(require, exports, module) {

    // Import core Famous dependencies
    var View               = require('famous/core/View');
    var Utility            = require('famous/utilities/Utility');
    var Surface            = require('famous/core/Surface');
    var VerticalScrollView = require('custom/VerticalScrollView');
    var Engine             = require('famous/core/Engine');

    var Templates      = require('custom/Templates');
    var RecentItemView = require('views/RecentItemView');

    var RECENT_VIEW_SIZE = 40;

    function RecentsSectionView(options) {

        View.call(this);
        window.rec = this;
        this.title = Templates.recentsHeader();
        this.navigation = {
            caption: 'Calls',
            icon: '<i class="fa fa-phone"></i>'
        };

        this.collection = options.collection;
        this.scrollview = new VerticalScrollView({
            startAt: 'top'
        });
        this.pipe(this.scrollview);
        this._add(this.scrollview);

        this.collection.once('sync', function () {
            this.loadItems();
            this.collection.on('all', function (e, model, collection, options) {
                //            console.log('recents ',e);
                switch (e) {
                    case 'remove':
                        this.scrollview.removeByIndex(options.index);
                        break;
                    case 'add':
                        this.addItem(model);
                        while (this.collection.size() > RECENT_VIEW_SIZE) {
                            this.collection.pop();
                        }
                        break;
                    case 'change':
                        var i = model.collection.indexOf(model);
                        this.sequence[i].updateItem();
                        break;
                }
            }.bind(this));
        }.bind(this));
    }

    RecentsSectionView.prototype = Object.create(View.prototype);
    RecentsSectionView.prototype.constructor = RecentsSectionView;

    RecentsSectionView.prototype.updateItems = function () {
        _.each(this.sequence, function (itemView) {
            if (itemView.updateItem) itemView.updateItem();
        });
    };

    RecentsSectionView.prototype.loadItems = function () {
        //    this.collection.fetch();
        this.scrollview.setPosition(0);
        this.sequence = this.collection.map(function (item) {
            var surface = new RecentItemView({model: item});
            surface.pipe(this._eventOutput);
            this._eventInput.pipe(surface);
            return surface;
        }.bind(this));
        this.scrollview.sequenceFrom(this.sequence);
    };

    RecentsSectionView.prototype.addItem = function (call) {
        var surface = new RecentItemView({model: call});
        surface.pipe(this._eventOutput);
        this._eventInput.pipe(surface);
        this.scrollview.addByIndex(0, surface);
    };

    RecentsSectionView.prototype.removeItemByIndex = function (index) {
        this.scrollview.removeByIndex(index);
    };

    RecentsSectionView.prototype.clearAll = function () {
        //    _.invoke(this.collection.all(), 'destroy');
        _(this.collection.all()).each(function (item) {
            item.collection.remove(item)
        });
    };

    RecentsSectionView.prototype.setMissedOnly = function (miss) {
        var missedOnly = (miss == 'missed');
        if (missedOnly) {
            // detach the spring before collapse
            this.scrollview.detachAgent();
            setTimeout(function () {
                this.scrollview.scrollTo(0, 0);
                this.scrollview.attachAgent();
            }.bind(this), 100);

            setTimeout(function () {
                _.each(this.sequence, function (itemView) {
                    if (itemView.collapse && !itemView.model.isMissed()) {
                        itemView.collapse();
                    }
                }.bind(this));
            }.bind(this), 200)
        } else {
            _.each(this.sequence, function (itemView) {
                if (itemView.expand) itemView.expand();
            }.bind(this));
        }
        setTimeout(function () {
            this.scrollview.emptySurfaceResize()
        }.bind(this), 300);
    };

    module.exports = RecentsSectionView;

});
