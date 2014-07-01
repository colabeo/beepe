// import famous modules
var View               = require('famous/view');
var Utility            = require('famous/utilities/utility');
var Scrollview         = require('famous/views/scrollview');
var HeaderFooterLayout = require('famous/views/header-footer-layout');
var EventHandler       = require('famous/core/EventHandler');
var Modifier           = require('famous/modifier');
var GenericSync        = require('famous/input/generic-sync');
var Surface            = require('famous/surface');

// import custom modules
var InputSync          = require('custom-input-sync');
var TouchSync          = InputSync.TouchSync;
var MouseSync          = InputSync.MouseSync;

// import views
var SocialItemView     = require('social-item-view');

function SocialView(options) {

    View.call(this);

    this.searchBarSize = 50;
    this.abcSurfaceWidth = 30;
    this.abcSurfaceHeight = undefined;
    this.a2zString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#';

    // Set up event handlers
    // this.eventInput = new EventHandler();
    // EventHandler.setInputHandler(this, this.eventInput);
    // this.eventOutput = new EventHandler();
    // EventHandler.setOutputHandler(this, this.eventOutput);

    this.headerFooterLayout = new HeaderFooterLayout({
        headerSize: this.searchBarSize,
        footerSize: 0
    });

    this.searchSurface = new Surface({
        size: [undefined, this.searchBarSize],
        classes: ['import-section-search-bar'],
        content: '<div><i class="fa fa-search"></i>   ' +
            '<input type="text" class="search-import" placeholder = "Search" ></div></div>',
        properties:{
            backgroundColor: 'rgba(15,15,15,0.9)',
            color: 'white',
            zIndex:2
        }
    });

    this.abcSurface = new Surface({
        size: [this.abcSurfaceWidth, this.abcSurfaceHeight],
        classes: ['abcButton'],
        content: '<button id="A">A</button><button id="B">B</button><button id="C">C</button><button id="D">D</button><button id="E">E</button><button id="F">F</button><button id="G">G</button><button id="H">H</button><button id="I">I</button><button id="J">J</button><button id="K">K</button><button id="L">L</button><button id="M">M</button><button id="N">N</button><button id="O">O</button><button id="P">P</button><button id="Q">Q</button><button id="R">R</button><button id="S">S</button><button id="T">T</button><button id="U">U</button><button id="V">V</button><button id="W">W</button><button id="X">X</button><button id="Y">Y</button><button id="Z">Z</button><button id="#">#</button>',
        properties:{
            backgroundColor: 'rgba(160,160,160,0.0)',
            zIndex:2
        }
    });

    this.abcMod = new Modifier({
        origin: [1.0, 0.0]
    });

    this.collection = options.collection;
    this.scrollview = new Scrollview({
        direction: Utility.Direction.Y,
        margin: 10000
    });

    this.headerFooterLayout.id.header.add(this.searchSurface);
    this.headerFooterLayout.id.content.add(this.scrollview);
    this.headerFooterLayout.id.content.add(this.abcMod).add(this.abcSurface);

    this.pipe(this.scrollview);
    this._add(this.headerFooterLayout);

    this.loadContacts();

    this.searchSurface.on('keyup', function(e){
        this.loadContacts(e.target.value);
    }.bind(this));

//    this.abcSurface.on('mousemove',function(e){
//        this.onAbcTouch(e);
//    }.bind(this));

    // abc-bar effect for cellphone
    var mousePosition = [0,0];
    var sync = new GenericSync(function(){
        return mousePosition;
    },{
        syncClasses:[MouseSync, TouchSync]
    });
    this.abcSurface.pipe(sync);
    sync.on('update',function(data){
        var target = document.elementFromPoint(data.ap[0], data.ap[1]);
        if (target.id == undefined || target.id =='' ) return
        var index = this.a2zString.indexOf(target.id);
        index = this.a2zIndexArray[index];
        if (index == undefined || index == this.curAbcIndex) return;
        this.curAbcIndex = index;
        this.scrollTo(index);
    }.bind(this));

//        this.abcSurface.on('mouseup',onAbcTouch.bind(this));
//        this.abcSurface.on('touchstart',onAbcTouch.bind(this));
//        this.abcSurface.on('touchmove',onAbcTouch.bind(this));
//        this.abcSurface.on('touchend',onAbcTouch.bind(this));
}

SocialView.prototype = Object.create(View.prototype);
SocialView.prototype.constructor = SocialView;

SocialView.prototype.loadContacts = function(searchKey) {
    if (searchKey) this.currentCollection = this.collection.searchContact(searchKey.toUpperCase());
    else this.currentCollection = this.collection;
    this.firstChar = undefined;
    this.a2zIndexArray = [0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
    this.currentCollection;

    var sequence = this.currentCollection.map(function(item) {
        return this.getIndex(item);
    }.bind(this));

    while (this.a2zIndexArray.indexOf(-1) != -1){
        this.a2zIndexArray[this.a2zIndexArray.indexOf(-1)]=this.a2zIndexArray[this.a2zIndexArray.indexOf(-1)-1];
    }

    // added empty item
    // media access bar messed up the height so add 40

    var lastGroupIndex = _.last(this.a2zIndexArray);
    var extraHeight = this.scrollview.getSize()[1] + 40;
    for (var i = lastGroupIndex; i<sequence.length; i++) {
        extraHeight -= sequence[i].getSize()[1];
    }

    if (extraHeight > 0) {
        var emptySurface = new Surface({
            size: [undefined, extraHeight]
        });
        emptySurface.pipe(this._eventOutput);
        sequence.push(emptySurface);
    }

    this.scrollview.sequenceFrom(sequence);
};

SocialView.prototype.onAbcTouch = function(e) {
    if (!this.abcButtons) this.abcButtons = $('.abcButton button');
//            var index = Math.floor(27*(e.y-$('.abcButton').position().top)/(this.abcButtons.length*this.abcButtons.height()));
    var index = this.abcButtons.indexOf(e.target);
    index = this.a2zIndexArray[index];
    if (index == undefined || index == this.curAbcIndex) return;
    this.curAbcIndex = index;
    this.scrollTo(index);
}

SocialView.prototype.getIndex = function (item){
    var isFirst = false;
    if (!/^[a-zA-Z]+$/.test(item.get('lastname')[0])){
        if (this.firstChar != "#"){
            this.firstChar = "#";
            isFirst = "#";
            this.getCurrentIndex(item);
        }
    }
    else if (item.get('lastname') && this.firstChar != item.get('lastname')[0].toUpperCase()) {
        this.firstChar = item.get('lastname')[0].toUpperCase();
        isFirst = this.firstChar;
        this.getCurrentIndex(item);
    }
    var surface = new SocialItemView({model: item}, isFirst);
    surface.pipe(this._eventOutput);
    return surface;
};

SocialView.prototype.getCurrentIndex = function (item){
    var index = this.currentCollection.indexOf(item);
    this.a2zIndexArray[this.a2zString.indexOf(this.firstChar)] = index;
};

SocialView.prototype.scrollTo = function(index, position) {
    if (index<0) return;
    this.scrollview.setVelocity(0);
    this.scrollview.node.index = index;
    if (!position) position = 0;
    this.scrollview.setPosition(position);
};

module.exports = SocialView;
