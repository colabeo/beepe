define(function(require, exports, module) {

    var TitleBar = require('famous/widgets/TitleBar');
    var Modifier = require('famous/core/Modifier');

    function HeaderBar(options) {
        TitleBar.apply(this, arguments);
        //    this.surfaces = new RenderNode ();
        this.surfacesMod = new Modifier();
        //    this._node.add(this.surfacesMod).add(this.surfaces);
    }

    HeaderBar.prototype = Object.create(TitleBar.prototype);
    HeaderBar.prototype.constructor = HeaderBar;

    HeaderBar.prototype.collapse = function (callback) {
        this.hide();
        this.headerResize = true;
        this.setOptions({size: [undefined, -1]});
    };

    HeaderBar.prototype.expand = function (callback) {
        this.show();
        this.headerResize = true;
        this.setOptions({size: [undefined, 50]});
    };

    //HeaderBar.prototype.getSize = function() {
    //    if (this.headerResize) {
    //        var n = -this.options.size[1];
    //        if (this.lightbox.transforms[0]) {
    //            n = this.lightbox.transforms[0].transformTranslateState.get()[1];
    //        };
    //        return [this.options.size[0], Math.floor(this.options.size[1] + n) || -1];
    //    } else {
    //        return this.options.size;
    //    }
    //};

    HeaderBar.prototype.show = function (title) {
        if (!title) title = this.curTitle;
        else this.curTitle = title;
        if (title != '<div></div>')
            TitleBar.prototype.show.apply(this, [title]);
        else
            this.lightbox.hide();
        this.headerResize = false;
    };

    HeaderBar.prototype.hide = function () {
        this.lightbox.hide();
        this.headerResize = false;
    }

    module.exports = HeaderBar;

});

