define(function(require, exports, module) {

    var View               = require('famous/core/View');
    var GridLayout         = require('famous/views/GridLayout');
    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var Surface            = require('famous/core/Surface');
    var Modifier           = require('famous/core/Modifier');
    var Transform          = require('famous/core/Transform');
    var LightBox           = require('famous/views/Lightbox');
    var RenderNode         = require('famous/core/RenderNode');
    var Engine             = require('famous/core/Engine');

    var Helpers = require('custom/Helpers');

    var Models = require("models");
    var Call   = Models.Call;

    var DialItemView = require('views/DialItemVIew');
    var Templates    = require('custom/Templates');

    var HeaderSize = 75;
    var ButtonSize = 75;

    function DialSection(options) {

        View.call(this);

        this.title = Templates.dialHeader();
        this.navigation = {
            caption: 'Dial',
            icon: '<i class="fa fa-th"></i>'
        };
        this.collection = options.collection;

        _initDialOutputView.call(this);
        _initNumbers.call(this);
        _initLayout.call(this);
        _initEvent.call(this);
        _initKeyBoardEvent.call(this);

    }

    DialSection.prototype = Object.create(View.prototype);
    DialSection.prototype.constructor = DialSection;

    function _initDialOutputView() {

        this.dialOutputView = new View();
        this.dialOutputViewMod = new Modifier({
            transform: Transform.translate(0, -50, 3)
        });

        this.outputSurface = new Surface({
            size: [undefined, HeaderSize],
            classes: ['dial-output-view-surface'],
            content: Templates.dialOutputView(),
            properties: {
                zIndex: "3",
                fontSize: "50px",
                backgroundColor: "transparent"
            }
        });

        this.dialOutputViewButtons = new Surface({
            content: Templates.dialOutputViewButton(),
            size: [undefined, 40],
            properties: {
                zIndex: "4"
            }
        });

        this.dialOutputViewButtonsLightBox = new LightBox({
            inTransform: Transform.translate(0, 35, 0),
            inTransition: {duration: 200},
            outTransform: Transform.translate(0, 35, 0),
            outTransition: {duration: 300},
            showTransform: Transform.translate(0, 35, 0),
            showOrigin: [0.9, 0.5]
        });

        this.matchContact = new Surface({
            size: [undefined, 20],
            properties: {
            }
        });
        this.matchContactLightBox = new LightBox({
            inTransform: Transform.translate(0, HeaderSize - 15, 0),
            inTransition: {duration: 200},
            outTransform: Transform.translate(0, HeaderSize - 15, 0),
            outTransition: {duration: 300},
            showTransform: Transform.translate(0, HeaderSize - 15, 0)
        });

        this.dialOutputView._add(this.outputSurface);
        this.dialOutputView._add(this.dialOutputViewButtonsLightBox);
        this.dialOutputView._add(this.matchContactLightBox);
    }

    function _initNumbers() {
        this.inputNumbers = [];
        this.contentLayout = new GridLayout({
            dimensions: [3, 5]
        });
        this.numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
        this.ABC = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
        this.numbersSurfaces = [];
        this.num = {};
        for (var i = 0; i < this.numbers.length; i++) {

            if (this.numbers[i] == ' ') {
                this.numbersSurfaces.push('');
                continue;
            }
            this.num['key' + this.numbers[i]] = new DialItemView({
                name: this.numbers[i],
                buttonSize: ButtonSize,
                abc: this.ABC[i - 1],
                tone: ['content/audio/numberTone', this.numbers[i]].join(''),
                float: 0.75 - (i % 3) / 4
            });
            this.num['key' + this.numbers[i]].pipe(this._eventOutput);
            this.numbersSurfaces.push(this.num['key' + this.numbers[i]]);
        }

        this.numbersSurfaces.push('');

        this.callButton = new View();
        this.callSurface = new Surface({
            size: [ButtonSize, ButtonSize],
            content: Templates.phoneButton('dial-call')
        });
        this.callSurface.pipe(this._eventOutput);
        this.callSurfaceMod = new Modifier({
            origin: [0.5, 0.5]
        });
        this.callButton._add(this.callSurfaceMod).add(this.callSurface);
        this.numbersSurfaces.push(this.callButton);

        this.numbersSurfaces.push('');

        this.contentLayout.sequenceFrom(this.numbersSurfaces);
    }

    function _initLayout() {
        this.layout = new HeaderFooterLayout({
            headerSize: HeaderSize - 50,
            footerSize: 0
        });
        this.layout.id.header.add(this.dialOutputViewMod).add(this.dialOutputView);
        this.layout.id.content.add(this.contentLayout);
        this._add(this.layout);
    }

    function _initEvent() {
        this._eventOutput.on('pressNumber', this.onPressNumber.bind(this));
        this.callSurface.on('click', this.onSendCall.bind(this));

        this.timeout;
        this.startDelete = 800;

        this.repeat = function () {
            this.onDeleteDial();
            this.timeout = setTimeout(this.repeat, this.startDelete);
            if (this.inputNumbers.length == 0) clearTimeout(this.timeout);
            this.startDelete = 50;
        }.bind(this);

        this.dialOutputViewButtons.on('mousedown', function (e) {
            if ($(e.target).hasClass('delete-num-button')) this.repeat();
        }.bind(this));
        this.dialOutputViewButtons.on('mouseup', function (e) {
            //        if ($(e.target).hasClass('delete-num-button')) {
            clearTimeout(this.timeout);
            this.startDelete = 800;
            //        }
        }.bind(this));
        this.dialOutputViewButtons.on('mouseleave', function (e) {
            if ($(e.target).hasClass('delete-num-button')) {
                clearTimeout(this.timeout);
                this.startDelete = 800;
            }
        }.bind(this));

        this.dialOutputViewButtons.on('click', function (e) {
            if ($(e.target).hasClass('add-button')) {
                this.onAddContact();
            }
        }.bind(this));
    }

    function _initKeyBoardEvent() {
        $(document).bind("keydown", function (e) {
            if (!$('.dial-number').length) return;
            var ii = this.keycodeToEvent(e);
            if (ii == "call") {
                this.onSendCall()
            }
            else if (ii == 'delete') {
                e.preventDefault();
                this.onDeleteDial();
            }
            else {
                this.num['key' + ii].press();
            }
        }.bind(this));
    }

    DialSection.prototype.onPressNumber = function (num) {
        this.inputNumbers.unshift(num);
        this.showDialOutputViewButtons();
        this.showOutputNumbers();
        this.setTemplateCall();
    };

    DialSection.prototype.onDeleteDial = function () {
        this.inputNumbers.shift();
        this.showDialOutputViewButtons();
        this.showOutputNumbers();
        this.setTemplateCall();
    };

    DialSection.prototype.onClearDial = function () {
        this.inputNumbers = [];
        this.showDialOutputViewButtons();
        this.showOutputNumbers();
        this.setTemplateCall();
        this.matchContactLightBox.hide();
    };

    DialSection.prototype.setTemplateCall = function () {
        if (this.inputNumbers.length == 0) return
        this.templateCall = new Call({
            firstname: '',
            lastname: '',
            phone: _.clone(this.inputNumbers).reverse().join('')
        });
        var index = _.chain(this.collection.models)
            .map(function (i) {
                return i.get('phone')
            })
            .indexOf(this.templateCall.get('phone')).value();
        if (index >= 0) {
            this.templateCall = this.collection.models[index];
            this.showMatchContact();
            this.matchContactLightBox.show(this.matchContact);
        } else {
            this.matchContactLightBox.hide();
        }
    };

    DialSection.prototype.onSendCall = function () {
        if (Helpers.isIPhone()) {
            if (this.templateCall.get('phone')) window.open("tel:" + this.templateCall.get('phone'));
        } else {
            this._eventOutput.emit('outgoingCall', this.templateCall);
        }
        this.onClearDial();
    };

    DialSection.prototype.onAddContact = function () {
        this._eventOutput.emit('editContact', this.templateCall);
    };

    DialSection.prototype.showDialOutputViewButtons = function () {
        if (this.inputNumbers.length == 0) {
            this.dialOutputViewButtonsLightBox.hide();
        }
        else if (this.inputNumbers.length > 0 && this.dialOutputViewButtonsLightBox._showing == false) {
            this.dialOutputViewButtonsLightBox.show(this.dialOutputViewButtons);
        }
    };

    DialSection.prototype.showOutputNumbers = function () {
        this.outputSurface.setContent(Templates.dialOutputView(this.inputNumbers.join('')));
        this.setOutputViewFontSize(this.inputNumbers.length);
    };

    DialSection.prototype.showMatchContact = function () {
        //    this.matchContact.setContent(Templates.dialOutputViewMatchContact('shana'));
        this.matchContact.setContent(Templates.dialOutputViewMatchContact(this.templateCall));
    };

    DialSection.prototype.setOutputViewFontSize = function (msgLength) {
        var totalWidth = this.outputSurface.getSize(true)[0];
        var max = 50;
        var min = 30;
        var fontSize = totalWidth / msgLength;  // this an estimate the font size, but accurate enough.
        if (fontSize > max) fontSize = max;
        if (fontSize < min) fontSize = min;

        this.outputSurface.setProperties({fontSize: fontSize + "px"});
    };

    DialSection.prototype.keycodeToEvent = function (event) {
        var keycode = event.keyCode;
        if (keycode == 8) {
            // backspace
            return "delete";
        }
        if (keycode == 13) {
            // enter
            return "call";
        }
        else if ((keycode >= 48 && keycode <= 57) || (keycode >= 65 && keycode <= 90)) {
            // 0-9 A-Z
            var char = String.fromCharCode(keycode);
            switch (char) {
                case "1":
                    return "1";
                case "2":
                case "A":
                case "B":
                case "C":
                    return "2";
                case "D":
                case "E":
                case "F":
                    return "3";
                case "4":
                case "G":
                case "H":
                case "I":
                    return "4";
                case "5":
                case "J":
                case "K":
                case "L":
                    return "5";
                case "6":
                case "M":
                case "N":
                case "O":
                    return "6";
                case "7":
                case "P":
                case "Q":
                case "R":
                case "S":
                    return "7";
                case "T":
                case "U":
                case "V":
                    return "8";
                case "9":
                case "W":
                case "X":
                case "Y":
                case "Z":
                    return "9";
                case "0":
                    return "0";
                case "3":
                    return (event.shiftKey) ? "#" : "3";
                case "8":
                    return (event.shiftKey) ? "*" : "8";
            }
        }
        else
            return ""
    };

    module.exports = DialSection;

});
