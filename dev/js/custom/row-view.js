var RenderNode = require('famous/render-node');
var View = require('famous/view');
var Modifier = require('famous/modifier');

function RowView(options){
    View.apply(this, arguments);
    this.surfaces = new RenderNode ();
    this.surfacesMod = new Modifier();
    this._node.add(this.surfacesMod).add(this.surfaces);
}

RowView.prototype = Object.create(View.prototype);
RowView.prototype.constructor = RowView;

RowView.prototype.collapse = function(callback) {
    this.surfacesMod.setOpacity(0,{duration:300}, callback);
};

RowView.prototype.expand = function (callback) {
    this.surfacesMod.setOpacity(1,{duration:300}, callback);
};

RowView.prototype.getSize = function() {
    var sh = this.surfacesMod.opacityState.get();
    return [this.options.size[0], Math.floor(this.options.size[1]*sh) || 0];
};



module.exports = RowView;

