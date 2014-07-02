define(function(require, exports, module) {

    var RenderNode      = require('famous/core/RenderNode');
    var Surface         = require('famous/core/Surface');
    var Modifier        = require('famous/core/Modifier');
    var GenericSync     = require('famous/inputs/GenericSync');
    var MouseSync       = require('famous/inputs/MouseSync');
    var TouchSync       = require('famous/inputs/TouchSync');
    var Transform       = require('famous/core/Transform');
    var Easing          = require('famous/transitions/Easing');
    var Transitionable  = require('famous/transitions/Transitionable');
    var WallTransition  = require('famous/transitions/WallTransition');
    var SpringTransition = require('famous/transitions/SpringTransition');
    var Engine          = require('famous/core/Engine');
    var Utility         = require('famous/utilities/Utility');

    var Templates   = require('custom/Templates');
    var RowView     = require('custom/RowView');
    var Helpers     = require('custom/Helpers');

    Transitionable.registerMethod('wall', WallTransition);
    Transitionable.registerMethod('spring', SpringTransition);

    function ItemView(options) {
        RowView.apply(this, arguments);
        this.model = options.model;
        this.options = {
            paddingLeft: 20,
            paddingRight: 20,
            buttonSizeX: 50,
            buttonSizeY: 50,
            _leftEndOrigin: [0, 0],
            _rightEndOrigin: [1, 0],
            size: [true, 50]
        };

        this.setOptions(options);

        this.setupSurfaces();
        this.setupEvent();
        this.buttonsClickEvents();

        this.isEditingMode = false;
        this.areEditingMode = false;

        this.returnZeroOpacityTransition = {
            'curve': Easing.linearNorm,
            'duration': 100
        };

        this.wallTransition = {
            method: 'wall',
            period: 300,
            dampingRatio: 1
        };

        Engine.on('resize', this.resizeItem.bind(this));
    }

    ItemView.prototype = Object.create(RowView.prototype);
    ItemView.prototype.constructor = ItemView;

    ItemView.prototype.setupEvent = function () {

        this.pos = new Transitionable([0, 0]);
        var sync = new GenericSync(function () {
                return this.pos.get();
            }.bind(this), {
                syncClasses: [Helpers.deviceSync()]
            }
        );
        this.itemSurface.pipe(sync);
        this.itemSurface.pipe(this._eventOutput);

        sync.on('start', function () {
            this.pos.set(this.isEditingMode ? [this.options.nButtons * this.options.buttonSizeX, 0] : [0, 0]);
            this._directionChosen = false;
            this.clickTimeout = setTimeout(function () {
                this.itemSurface.setProperties({backgroundColor: 'rgba(255,255,255,0.1)'});
            }.bind(this), 100);
        }.bind(this));

        sync.on('update', function (data) {
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                delete this.clickTimeout;
            }
            this.itemSurface.setProperties({backgroundColor: 'transparent'});
            this.pos.set(data.p);  // the displacement from the start touch point.
            if (Helpers.isMobile() && !this._directionChosen) {
                var diffX = this.isEditingMode ? Math.abs(this.pos.get()[0] - this.options.nButtons * this.options.buttonSizeX) : Math.abs(this.pos.get()[0]),
                    diffY = Math.abs(this.pos.get()[1]);
                this.direction = diffX > diffY ? Utility.Direction.X : Utility.Direction.Y;
                this._directionChosen = true;
                if (this.direction == Utility.Direction.X) {
                    this.itemSurface.unpipe(this._eventOutput);
                }
                else {
                    this.itemSurface.pipe(this._eventOutput);
                }
            } else {
                if (!Helpers.isMobile() || this.direction == Utility.Direction.X) {
                    this.animateItem();
                    this.animateLeftButtons();
                    this.animateRightButtons();
                }
            }

        }.bind(this));

        sync.on('end', function (data) {
            setTimeout(function () {
                this.itemSurface.setProperties({backgroundColor: 'transparent'});
            }.bind(this), 300);
            this.pos.set(data.p);
            if (Helpers.isMobile() && this.direction != Utility.Direction.X) return;
            if (this.pos.get()[0] > this.options.nButtons * this.options.buttonSizeX) {
                this.toggleEditing();
            } else {
                this.setEditingOff();
            }
            if (this.pos.get()[0] < -0.3 * window.innerWidth) {
                this._eventOutput.emit(this.options.rightButton.event, this.model);
                this.setEditingOff();
            }
        }.bind(this));
    };

    ItemView.prototype.setOptions = function (options) {
        _.extend(this.options, options);
        this.options.nButtons = (options.leftButtons) ? options.leftButtons.length : 0;
    };

    ItemView.prototype.setupSurfaces = function () {
        //        var bc = this.model.collection.indexOf(this.model)%2 ? 0.1 : 0.2;
        this.backgroundSurface = new Surface({
            content: Templates.itemFrame2(this.options.leftButtons, this.options.rightButton, this.options.paddingLeft, this.options.paddingRight),
            size: this.options.size,
            properties: {
                zIndex: -1
            }
        });
        this.surfaces.add(this.backgroundSurface);

        this.itemSurface = new Surface({
            classes: this.options.itemButton.classes,
            content: this.options.itemButton.content,
            size: this.options.size,
            properties: {
                backgroundColor: "transparent",
                zIndex: 9
            }
        });
        this.itemMod = new Modifier({
            origin: this.options._leftEndOrigin
        });

        this.surfaces.add(this.itemMod).add(this.itemSurface);
    };

    ItemView.prototype.updateItem = function () {
        this.itemSurface.setContent(Templates.recentItemView(this.model));
    };

    ItemView.prototype.animateItem = function () {
        this.itemMod.setTransform(Transform.translate(this.pos.get()[0], 0, 0));
    };

    ItemView.prototype.animateItemEnd = function () {
        var translate = Transform.identity;
        if (this.isEditingMode) {
            translate = Transform.translate(this.options.nButtons * this.options.buttonSizeX, 0, 0);
        } else {
            translate = Transform.translate(0, 0, 0);
        }
        this.itemMod.setTransform(translate, this.wallTransition);
    };

    ItemView.prototype.animateLeftButtons = function () {
        this.leftButtons = _.first(this.getButtons(), this.options.nButtons);
        for (var i = 0; i < this.options.nButtons; i++) {
            this.leftButtons[i].style.opacity = Math.min((this.pos.get()[0] - this.options.buttonSizeX * (i)) / (this.options.buttonSizeX), 1);
        }
    };

    ItemView.prototype.animateLeftButtonsEnd = function () {
        this.leftButtons = _.first(this.getButtons(), this.options.nButtons);
        if (!this.leftButtons) return;
        for (var i = 0; i < this.options.nButtons; i++) {
            if (this.isEditingMode) {
                this.leftButtons[i].style.opacity = 1;
            } else {
                this.leftButtons[i].style.opacity = 0;
            }
        }
    };

    ItemView.prototype.animateRightButtons = function () {
        this.rightButton = _.last(this.getButtons());
        if (this.options.rightButton && this.pos.get()[0] < 0) {
            this.rightButton.style.opacity = Math.min(-1 * this.pos.get()[0] / (0.3 * window.innerWidth), 1);
        }
    };

    ItemView.prototype.animateRightButtonsEnd = function () {
        this.rightButton = _.last(this.getButtons());
        if (!this.rightButton) return;
        if (this.options.rightButton) this.rightButton.style.opacity = 0;

    };

    ItemView.prototype.resizeItem = function () {
        if (this.itemSurface._currTarget) this.itemSurface._currTarget.children[0].style.width = window.innerWidth + 'px';
        if (this.backgroundSurface._currTarget) {
            this.backgroundSurface._currTarget.children[0].style.width = window.innerWidth - this.options.paddingLeft - this.options.paddingRight + 'px';
            //            outerHTML = Templates.itemFrame(this.options.paddingLeft, this.options.paddingRight);
        }
    };

    ItemView.prototype.setEditingOn = function () {
        this.isEditingMode = true;
        this.animateItemEnd();
        this.animateLeftButtonsEnd();
        this.animateRightButtonsEnd();
    };

    ItemView.prototype.setEditingOff = function () {
        setTimeout(function () {
            this.isEditingMode = false;
            this.animateItemEnd();
            this.animateLeftButtonsEnd();
            this.animateRightButtonsEnd();
        }.bind(this), 100);
    };

    ItemView.prototype.toggleEditing = function () {
        this.isEditingMode = !this.isEditingMode;
        this.animateItemEnd();
        this.animateLeftButtonsEnd();
        this.animateRightButtonsEnd();
    };

    ItemView.prototype.onToggleAll = function () {
        //    console.log('toggleAll');
        if (this.areEditingMode == false) {
            this.setEditingOn();
        } else {
            this.setEditingOff();
        }
        this.areEditingMode = !this.areEditingMode;
    };

    ItemView.prototype.buttonsClickEvents = function () {
        this.itemSurface.on('click', function () {
            if (this.pos.get()[0] == 0 && this.pos.get()[1] == 0 && this.isEditingMode == false) {
                this._eventOutput.emit(this.options.itemButton.event, this.model);
            }
        }.bind(this));

        this._eventInput.on('backToNoneEditing', function () {
            this.areEditingMode = false
        }.bind(this))
    };

    ItemView.prototype.getButtons = function () {
        if (!this.buttons && this.backgroundSurface._currTarget) {
            this.buttons = this.backgroundSurface._currTarget.children[0].children;
            _(_.first(this.buttons, this.options.nButtons)).each(function (b, i) {
                $(b).on('click', function () {
                    this._eventOutput.emit(this.options.leftButtons[i].event, this.model);
                }.bind(this))
            }.bind(this));
        }
        return this.buttons;
    };

    module.exports = ItemView;

});