var GenericSync = require('famous/input/generic-sync');
var MouseSync = require('famous/input/mouse-sync');
var TouchSync = require('famous/input/touch-sync');
var Utility = require('famous/utilities/utility');

var Templates    = require('templates');
var RowView    = require('row-view');
var ItemView = RowView.ItemView2S;
var Helpers   = require('helpers');

function SocialItemView(options) {

    this.model = options.model;
    options.paddingRight = 40;

    options.itemButton = {
        classes: ['contact-item', 'editable'],
        content: Templates.socialItemView(options.model),
        event: 'goBack'
    };

    ItemView.apply(this, arguments);
}

SocialItemView.prototype = Object.create(ItemView.prototype);
SocialItemView.prototype.constructor = SocialItemView;

// Overwrite the events functions since there is only one button event in Social-view,

SocialItemView.prototype.setupEvent = function(){
    var sync = new GenericSync(function(){
        return this.pos;
    }.bind(this), {
            syncClasses:[Helpers.deviceSync()]
        }
    );
    this.itemSurface.pipe(sync);
    this.itemSurface.pipe(this._eventOutput);
    this.pos = [0,0];

    sync.on('start', function() {
        this.pos = [0,0];
        this._directionChosen = false;
        this.clickTimeout = setTimeout(function(){
            this.itemSurface.setProperties({backgroundColor: 'rgba(255,255,255,0.1)'});
        }.bind(this),100);
    }.bind(this));

    sync.on('update', function(data) {
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            delete this.clickTimeout;
        }
        this.itemSurface.setProperties({backgroundColor: 'transparent'});
        this.pos = data.p;  // the displacement from the start touch point.
        if( Helpers.isMobile() && !this._directionChosen ) {
            var diffX = Math.abs( this.pos[0] ),
                diffY = Math.abs( this.pos[1] );
            this.direction = diffX > diffY ? Utility.Direction.X : Utility.Direction.Y;
            this._directionChosen = true;
            if (this.direction == Utility.Direction.X) {
                this.itemSurface.unpipe(this._eventOutput);
            }
            else {
                this.itemSurface.pipe(this._eventOutput);
            }
        }
    }.bind(this));

    sync.on('end', function() {
        setTimeout(function(){
            this.itemSurface.setProperties({backgroundColor: 'transparent'});
        }.bind(this),300);
    }.bind(this));
    if ( Helpers.isMobile() && this.direction != Utility.Direction.X) return;
};

SocialItemView.prototype.buttonsClickEvents = function() {
    this.itemSurface.on('click', function(){
        this._eventOutput.emit(this.options.itemButton.event, this.model);
    }.bind(this));
};

module.exports = SocialItemView;
