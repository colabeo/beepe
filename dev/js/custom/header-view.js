var Surface = require('famous/surface');
var Modifier = require('famous/modifier');
var Transform = require('famous/transform');
var Engine = require('famous/engine');

var Templates = require('templates');
var RowView = require('row-view');

function HeaderView(options){
    RowView.call(this);

//    this.model = options;
    this.options = {
//        collection: undefined,
        header: undefined,
        buttonSizeY: 20,
        classes: [],
        content: '',
        size : [true, 20]
    };

    this.setOptions(options);

//    this.containElements = this.options.collection.lastnameInitial(this.options.header).length != 0;

//    this.setItemSize();
    this.setupSurfaces();
    this.events();

    window.hh=this;

}

HeaderView.prototype = Object.create(RowView.prototype);
HeaderView.prototype.constructor = HeaderView;

HeaderView.prototype.setOptions = function(options){
    _.extend(this.options, options);
};

HeaderView.prototype.setupSurfaces = function(){
    this.headerMod = new Modifier();
    this.headerSurface = new Surface({
        classes: this.options.classes,
        size: this.options.size,
        properties:{
            color: "white"
        },
        content: this.options.content
    });
//    this.setContent();
    this.headerSurface.pipe(this._eventOutput);
    this.surfaces.add(this.headerMod).add(this.headerSurface);
};

//HeaderView.prototype.setContent = function (){
//    if (this.containElements) {
//        this.headerSurface.setContent(this.options.content);
//    } else {
//        this.headerSurface.setContent(Templates.fateHeaderItemView(0,0));
//    }
//};
//
//HeaderView.prototype.setItemSize = function (){
//    this.itemHeight = this.options.buttonSizeY;
//    this.options.size = [true, this.itemHeight];
//    if (!this.containElements) this.collapse();
//};

HeaderView.prototype.resizeItem = function(){
    if (this.headerSurface._currTarget) this.headerSurface._currTarget.children[0].style.width = window.innerWidth + 'px';
};

HeaderView.prototype.events = function() {

    Engine.on('resize', this.resizeItem.bind(this));

//    this.options.collection.on('all', function(e, model, collection, options) {
////        this.containElements = this.options.collection.lastnameInitial(this.options.header).length != 0;
////        console.log(this.options.header, this.containElements, this.options.collection.lastnameInitial(this.options.header).length)
//        if (this.containElements && this.options.collection.lastnameInitial(this.options.header).length == 0){
////            console.log('header collapse',this.options.header, this.containElements, this.options.collection.lastnameInitial(this.options.header).length);
//            this.containElements = false;
//            this.collapse();
//        } else if (!this.containElements && this.options.collection.lastnameInitial(this.options.header).length != 0){
////            console.log('header expand',this.options.header, this.containElements, this.options.collection.lastnameInitial(this.options.header).length);
//            this.setContent();
//            this.containElements = true;
//            this.headerSurface.setContent(this.options.content);
//            this.expand();
//        }
//    }.bind(this))
};

module.exports = HeaderView;

