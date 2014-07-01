// Import core Famous dependencies
var HeaderFooterLayout = require('famous/views/header-footer-layout');
var Surface            = require('famous/surface');
var EventHandler       = require('famous/core/EventHandler');

var UpDownTransform = require('up-down-transform');

function AddFavoriteView(options) {
    HeaderFooterLayout.call(this);

    var upDownTransform = new UpDownTransform;

    if(options.inTransform === undefined) this.options.inTransform = upDownTransform.options.inTransform;
    if(options.outTransform === undefined) this.options.outTransform = upDownTransform.options.outTransform;
    if(options.inTransition === undefined) this.options.inTransition = upDownTransform.options.inTransition;
    if(options.outTransition === undefined) this.options.outTransition = upDownTransform.options.outTransition;
    if(options.inOpacity === undefined) this.options.inOpacity = upDownTransform.options.inOpacity;
    if(options.outOpacity === undefined) this.options.outOpacity = upDownTransform.options.outOpacity;

    this.model = options.model;

    // Set up event handlers
    // this.eventInput = new EventHandler();
    // EventHandler.setInputHandler(this, this.eventInput);
    // this.eventOutput = new EventHandler();
    // EventHandler.setOutputHandler(this, this.eventOutput);

    this.header = new Surface({
        classes: ['header'],
        size: [undefined, 50],
        properties: {
        },
        content: '<button class="left close-button cancel-favorite">Cancel</button><div>Add to Favor</div><button class="right close-button done-favorite">Done</button>'
    });
    this.content = new Surface({
        classes: ['surface', 'add-favorite-view'],
        size: [undefined, undefined],
        properties: {
            backgroundColor: 'transparent'
        }
    });

    this.id.header.add(this.header);
    this.id.content.add(this.content);

    this.content.on('click', function() {

    }.bind(this));

    this.template();

    this.content.pipe(this._eventOutput);
    this.header.pipe(this._eventOutput);

    this.header.on('click', function(e){
        if (target.hasClass("close-button")) this._eventOutput.emit('showApp');
    }.bind(this));

}

AddFavoriteView.prototype = Object.create(HeaderFooterLayout.prototype);
AddFavoriteView.prototype.constructor = AddFavoriteView;

AddFavoriteView.prototype.template = function() {
    var html = '<form role="form">';
    html += '<div class="form-group small">';
    html += '<input type="text" class="form-control" id="input-first-name" placeholder="First">';
    html += '</div>';
    html += '<div class="form-group small">';
    html += '<input type="text" class="form-control" id="input-last-name" placeholder="Last">';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<input type="email" class="form-control" id="input-email" placeholder="Email">';
    html += '</div>';
    html += '</form>';
    this.content.setContent(html);
};

module.exports = AddFavoriteView;
