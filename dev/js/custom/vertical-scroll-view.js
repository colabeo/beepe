var View             = require('famous/view');
var Utility          = require('famous/utilities/utility');
var Surface          = require('famous/surface');
var Scrollview       = require('famous/views/scrollview');
var Engine           = require('famous/engine');

function VerticalScrollView(options) {
    Scrollview.apply(this,arguments);
    this.prepareEmptySurface();
    this.prepareResize();
    this.itemArray = [];
    window.ss=this
}

VerticalScrollView.prototype = Object.create(Scrollview.prototype);
VerticalScrollView.prototype.constructor = VerticalScrollView;

VerticalScrollView.prototype.setOptions = function (options){
    this.options.startAt = 'top'; // 'bottom'
    this.options.direction = Utility.Direction.Y;
    this.options.margin = 10000;
    Object.getPrototypeOf (VerticalScrollView.prototype).setOptions.apply(this, arguments);
    _.extend(this.options, options);
};

VerticalScrollView.prototype.prepareEmptySurface = function(){
    this.emptySurface = new Surface({
        properties: {
            backgroundColor: 'transparent'
        },
        size:[undefined, 1]
    });
    this.emptySurface.pipe(this);
};

VerticalScrollView.prototype.prepareResize = function(){
    var resizeTimeout;
    var onResize = function() {
        this.emptySurfaceResize();
    };
    Engine.on('resize', function(){
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(onResize.bind(this), 300);
    }.bind(this));
};

VerticalScrollView.prototype.sortBy = function(iterator){
    this.sequenceFrom(_.sortBy(this.itemArray, iterator));
};

VerticalScrollView.prototype.filter = function(predicate){
    // Not doing filter yet
    this.sequenceFrom(_.filter(this.itemArray, predicate));
};

VerticalScrollView.prototype.sequenceFrom = function(node){
    this.itemArray = _.clone(node);
//    _.each(this.itemArray, function(item) {
//        item.pipe(this);
//    }.bind(this));
    if (this.options.startAt == 'top') {
        node.push(this.emptySurface);
    } else {
        node.unshift(this.emptySurface);
    }
    // TODO: this.sequence need garbage collection
    Object.getPrototypeOf (VerticalScrollView.prototype).sequenceFrom.apply(this, arguments);
    this.emptySurfaceResize();
};

VerticalScrollView.prototype.emptySurfaceResize = function (msg){
//    console.log(msg)
    if (this.emptySurface) {
//        Engine.defer( doResize.bind(this));
        setTimeout(doResize.bind(this),300);
    }
    function doResize() {
        var extraHeight = this.getSize()[1];
        if (this.node) {
            var itemSequence = _.filter(this.node.array, function(i){return i instanceof Surface == false});
            for (var i = 0; i < itemSequence.length; i++){
                extraHeight -= itemSequence[i].getSize()[1];
                if (extraHeight <= 1) {
                    extraHeight = 1;
                    break;
                }
            }
        }
        this.emptySurface.setSize([undefined, extraHeight]);
    }
};

VerticalScrollView.prototype.scrollTo = function(index, position){
    if (!index) index = 0;
    if (!position) position = 0;
    this.node.index = index;
    this.setPosition(position);
};

VerticalScrollView.prototype.removeByIndex = function(index) {
    if (index<0) return;
    if (this.node) {
        var removedNode = this.itemArray.splice(index,1)[0];
        removedNode.collapse(function() {
            Engine.defer( function() {
                var i = this.node.array.indexOf(removedNode);
                this.node.splice(i,1);
                // this fixes first item removal return index -1 bug
                if (i==0) this.node.index = 0;
                this.emptySurfaceResize();
            }.bind(this));
        }.bind(this));
    }
};

VerticalScrollView.prototype.addByIndex = function(index, item) {
//    item.pipe(this);
    this.itemArray.splice(index, 0, item);
    this.node.splice(index, 0, item);
    // reset position
    this.node.index = 0;
    this.emptySurfaceResize();
};

VerticalScrollView.prototype.push = function(item) {
//  this will work for start at bottom only.
    this.itemArray.push(item);
    this.node.push(item);
    // reset position
//    this.node.index = 0;
    this.emptySurfaceResize('push');
};

VerticalScrollView.prototype.scrollToEnd = function() {
//    this.setVelocity(-1);
    var lastNode = this.node.array.length-1;
    var currNode = this.node.index;
    var screenSize = this.getSize()[1];
    var currPos = this.getPosition();
    var heightArray = this.node.array.map(function(d){
        if (d.getSize()[1]===true) return 100;
        return d.getSize()[1];
    });
    var sum = _.reduce(_(heightArray).last(lastNode-currNode + 1),function(memo,num){return memo + num;},0);
    var totalPixelsToMove = sum - currPos - screenSize + 100;
//    var totalPixelsToMove = _(heightArray).last(lastNode-currNode + 1).sum() - currPos - screenSize + 100;

    // 200ms animation, so avgVelocity = totalPixelsToMove/200ms, so v = 2*avgVelocity
    var v = Math.max(2*totalPixelsToMove/200,0);
    // TODO: hack, so it will never onEdge when scrollToEnd
    if (this._onEdge==-1 && this.emptySurface.getSize()[1]<=1 && this._springAttached) {
            this.scrollTo(1,0);
            setTimeout(function(){this.setVelocity(v)}.bind(this), 300);
    } else {
        Engine.defer(function(){this.setVelocity(v)}.bind(this));
    }
//    console.log(v)
};

VerticalScrollView.prototype.jumpToEnd = function() {
//    console.log(this.emptySurface.getSize()[1], this._onEdge)
    if (this.emptySurface.getSize()[1] > 1) return;
    if (this._onEdge != 0){
        var len = this.node.array.length;
        var index = Math.max(len-15,1);
        this.node.index=index;
    }
//    setTimeout(function(){
//        for (var i = index || this.node.index + 1; i< this.node.array.length; i++) {
//            this.node.index = i;
//            if (this._onEdge == 1) break
//        }
//    }.bind(this),100)
    setTimeout(function(){this.node.index = this.node.array.length - 1;}.bind(this),100)
};

VerticalScrollView.prototype.jumpToEnd0 = function() {
    var h = this.getSize()[1];
    var rowH = 62;
    var index = Math.max(this.node.array.length - Math.ceil(h/rowH), 0);
    this.node.index=index;
    this.setVelocity(0);
};
VerticalScrollView.prototype.jumpToEnd1 = function() {
    this.node.index = this.node.array.length -1 ;
};

VerticalScrollView.prototype.attachAgent = function() {
    if(this._springAttached) this.physicsEngine.attach([this.spring], this.particle);
    else this.physicsEngine.attach([this.drag, this.friction], this.particle);
};

VerticalScrollView.prototype.detachAgent = function() {
    this._springAttached = false;
    this.physicsEngine.detachAll();
};

module.exports = VerticalScrollView;
