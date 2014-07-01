// import views
var Surface          = require('famous/surface');

var SocialItemView    = require('social-item-view');

var ContactsScrollView = require('contacts-scroll-view');

function SocialScrollView(options) {

    options.itemView = SocialItemView;
    ContactsScrollView.apply(this, arguments);
    this._eventOutput.on('goBack', function(ii){console.log('onGoBack' , ii)});
}

SocialScrollView.prototype = Object.create(ContactsScrollView.prototype);
SocialScrollView.prototype.constructor = SocialScrollView;


SocialScrollView.prototype.collectionEvents = function() {
    this.collection.on('all', function(e, model) {
        console.log(e, model);
        switch(e)
        {
            case 'sync':
                this.renderHeaders();
                this.createSocialContacts();
                setTimeout(this.renderScrollView.bind(this), this.scrollview.node ? 0 : 1000);
                break;

        }
    }.bind(this));
};

SocialScrollView.prototype.createItem = function (item){
    var surface = new SocialItemView({model: item});
    surface.pipe(this._eventOutput);
    this._eventInput.pipe(surface);
    return surface;
};

SocialScrollView.prototype.createSocialContacts = function (){
    this.contactSequence = this.collection.map(function(item){
        return this.createItem(item);
    }.bind(this))
};

SocialScrollView.prototype.renderAddSurface = function() {
    var emptySurface = new Surface({
        size: [undefined, undefined]
    });
    this.scrollview.sequenceFrom([emptySurface]);
};

module.exports = SocialScrollView;
