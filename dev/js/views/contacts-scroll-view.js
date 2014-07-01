// import famous modules
var View               = require('famous/view');
var HeaderFooterLayout = require('famous/views/header-footer-layout');
var Utility            = require('famous/utilities/utility');
var Modifier           = require('famous/modifier');
var GenericSync        = require('famous/input/generic-sync');
var Surface            = require('famous/surface');
var Easing = require('famous/transitions/easing');

// import custom modules
var InputSync          = require('custom-input-sync');
var TouchSync          = InputSync.TouchSync;
var MouseSync          = InputSync.MouseSync;
var Templates          = require('templates');
var Transform = require('famous/transform');

// import views
var VerticalScrollView       = require('vertical-scroll-view');
var ContactItemView    = require('contact-item-view');
var RowView   = require('row-view');
var HeaderView = RowView.HeaderView;
var Helpers = require('helpers');

var SortKey;
var ItemView;

function ContactsScrollView(options) {
    View.call(this);

    SortKey = options.sortKey || 'lastname';
    this.sortKey = SortKey;
    ItemView = options.itemView || ContactItemView;


    this.searchKey = false;
    this.abcArray = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#';

    this.setupLayout(options);
    this.renderHeaders();
    this.prepareSequences();
    this.collectionEvents();
    this.abcSurfaceEvents();
    this.searchSurfaceEvents();
}

ContactsScrollView.prototype = Object.create(View.prototype);
ContactsScrollView.prototype.constructor = ContactsScrollView;

ContactsScrollView.prototype.collectionEvents = function() {
    this.collection.on('all', function(e, model) {
//        console.log('contacts ',e);
        switch(e)
        {
            case 'change':
                this.changeItem(model);
                break;
            case 'remove':
                this.removeItem(model);
                this.renderHeaders();
                if (this.collection.length == 0){
                    this.renderAddSurface();
                }
                break;
            case 'add':
                this.addItem(model);
                break;
            case 'sync':
                this.renderHeaders();
                // prevent collapse animation at init.
                setTimeout(this.renderScrollView.bind(this), this.scrollview.node.array.length > 1 ? 0 : 1000);
                break;

        }
    }.bind(this));
};

ContactsScrollView.prototype.prepareSequences = function() {
    this.contactSequence = [];
    this.headerSequence = _.map('ABCDEFGHIJKLMNOPQRSTUVWXYZ#', function(i){
        var headerSurface = new HeaderView({
            content: Templates.headerItemView(i,0,0),
            header: i
        });
        headerSurface.pipe(this.scrollview);
        return headerSurface;
    }.bind(this));
};

function refactorScrollviewEmptySurfaceResize (){
    if (!this.emptySurface) return;
    setTimeout(doResize.bind(this),300);
    function doResize() {
        var extraHeight = this.getSize()[1];
        if (this.node)
        var firstChar = _.chain(this.node.array)
            .filter(function(i){return i instanceof ItemView})
            .map(function(i){return i.model.get(SortKey)[0] || '#'}.bind(this))
            .map(function(i){return (/^[a-zA-Z]+$/.test(i))? i.toUpperCase():'#'})
            .value();
        var lastGroupLength = _.filter(firstChar,function(i){return i == _.last(firstChar)}).length;
        var itemView = _.find(this.node.array, function(i){return i instanceof  ItemView});
        var itemHeight = (itemView)? itemView.getSize()[1]:0;
        var headerView = _.find(_.clone(this.node.array).reverse(), function(i){return i instanceof  HeaderView});
        var headerHeight = (headerView)? headerView.getSize()[1]:0;
        extraHeight = Math.max(0,extraHeight - headerHeight - lastGroupLength * itemHeight);
        this.emptySurface.setSize([undefined, extraHeight]);
    }
}

ContactsScrollView.prototype.setupLayout = function(options) {
    this.searchBarSize = 50;
    this.abcSurfaceWidth = 30;
    this.abcSurfaceHeight = undefined;

    this.headerFooterLayout = new HeaderFooterLayout({
        headerSize: this.searchBarSize,
        footerSize: 0
    });
    this.LayoutMod = new Modifier();

    this.searchSurface = new Surface({
        size: [undefined, this.searchBarSize],
        content: ['<div class="contact-section-search-bar"><div><i class="fa fa-search"></i>   ' ,
            '<input type="text" class="search-contact" placeholder = "Search" ><span class="cancel">cancel</span></input></div></div>'].join(''),
        properties:{
            backgroundColor: 'rgba(15,15,15,0.9)',
            color: 'white'
//            zIndex: 10
        }
    });
    this.searchSurfaceMod = new Modifier({
        transform:Transform.translate(0,0,3)
    });
    this.searhBarTransition = {
        'duration' : 0
    };
    this.searchMode = false;

    this.abcSurface = new Surface({
        size: [this.abcSurfaceWidth, this.abcSurfaceHeight],
        classes: ['abcButton'],
        content: Templates.abcButtons(),
        properties:{
            backgroundColor: 'rgba(160,160,160,0.0)',
            zIndex:2
        }
    });
    this._eventInput.pipe(this.searchSurface);
    this.abcMod = new Modifier({
        origin: [1.0, 0.0],
        transform: Transform.translate(0,0,10)
    });

    this.title = '<button class="left edit-button" id="contact-edit-contact"></button><div>All Contacts</div><button class="right add-contact" id="add-contact"><i class="fa fa-plus" id="add-contact"></i></button>';
    this.navigation = {
        caption: 'Contacts',
        icon: '<i class="fa fa-users"></i>'
    };

    this.collection = options.collection;
    var scrollviewMargin = (Helpers.isMobile())? 500:10000;
    this.scrollview = new VerticalScrollView({
        margin: scrollviewMargin
    });
    this.scrollview.emptySurfaceResize = refactorScrollviewEmptySurfaceResize;
    this.scrollview.sequenceFrom([]);

    this.headerFooterLayout.id.header.add(this.searchSurfaceMod).add(this.searchSurface);
    this.headerFooterLayout.id.content.add(this.scrollview);
    this.headerFooterLayout.id.content.add(this.abcMod).add(this.abcSurface);

    this.pipe(this.scrollview);
    this._add(this.LayoutMod).add(this.headerFooterLayout);
};

ContactsScrollView.prototype.renderAddSurface = function() {
    var firstAdd = '<div class="firstAdd"><div> <i class="fa fa-plus fa-5x" ></i> </div> <div> Your contact list is empty,</div><div> Please add your first contact.</div></div>';
    var addSurface = new Surface({
        size: [undefined, undefined]
    });
//    addSurface.pipe(this._eventOutput);
    addSurface.setContent(firstAdd);
    addSurface.on('click',function(e){
        if ($(e.target).hasClass('fa-plus'))
            this._eventOutput.emit('editContact');
    }.bind(this));
    this.scrollview.sequenceFrom([addSurface]);
};

ContactsScrollView.prototype.renderScrollView = function() {
    if (this.collection.length == 0) {
        this.renderAddSurface();
        return;
    }
    var sequence = this.headerSequence.concat(this.contactSequence);
    var newSequence = arrangeSequence(sequence, sortBy(this.sortKey), searchBy(this.searchKey));
    this.scrollview.sequenceFrom(newSequence);
};

function sortBy(key) {
    key = key || 'lastname';
    return function(item) {
        var l, f, h;
        l = f = h = '';
        // " " is the earliest char
        if (item.model) l = item.model.get('lastname') || "#";
        if (item.model) f = item.model.get('firstname') || "#";
        if (item.options && item.options.header) h = item.options.header;
        var str;
        if (key.toLowerCase() == 'firstname')
            str = h + f + ' ' + l;
        else
            str = h + l + ' ' + f;
        // "{" is the next char after "z"
        if (!/^[a-zA-Z]+$/.test(str[0]))
            str = "{" + str;
        return str.toUpperCase();
    }
}

function searchBy(key) {
    return function(item) {
        if (!key)
            return key===false;
        else {
            key = key.toLowerCase();
            if (!item.model) return false;
            if (item.model.get('firstname').toLowerCase().indexOf(key) != -1 || item.model.get('lastname').toLowerCase().indexOf(key) != -1)
                return true;
        }
        return false;
    }
}

function arrangeSequence(sequence, sortFunction, searchFunction){
    return _.chain(sequence)
        .filter(searchFunction)
        .sortBy(sortFunction)
        .value();
}

ContactsScrollView.prototype.createItem = function (item){
    var surface = new ContactItemView({model: item});
    surface.pipe(this._eventOutput);
    this._eventInput.pipe(surface);
    return surface;
};

ContactsScrollView.prototype.addItem = function(item) {
    var newContact = this.createItem(item);
    this.contactSequence.push(newContact);
};

ContactsScrollView.prototype.removeItem = function(item) {
    var i = this.contactSequence.map(function(i){return i.model}).indexOf(item);
    this.contactSequence.splice(i,1);
    var i = this.scrollview.node.array.map(function(i){return i.model}).indexOf(item);
    this.scrollview.removeByIndex(i);
};

ContactsScrollView.prototype.changeItem = function(item) {
    // rely on model event to update itemView
};

ContactsScrollView.prototype.abcSurfaceEvents = function() {
    var mousePosition = [0,0];
    var sync = new GenericSync(function(){
        return mousePosition;
    },{
        syncClasses:[MouseSync,TouchSync]
    });
    this.abcSurface.pipe(sync);
    sync.on('start',function(data){
        this.scrollToContact(data);
    }.bind(this));
    sync.on('update',function(data){
        this.scrollToContact(data);
    }.bind(this));
};

ContactsScrollView.prototype.scrollToContact = function(data){
    var target = document.elementFromPoint(data.ap[0], data.ap[1]);
    if (!target || !target.id) return;
    var i = this.abcArray.indexOf(target.id);
    var index= this.scrollview.node.array.indexOf(this.headerSequence[i]);
    this.scrollview.scrollTo(index,0);
};

ContactsScrollView.prototype.searchSurfaceEvents = function() {
    this.searchSurface.on('click', function(e){
//        console.log(e);
        if (e.target.className == 'search-contact') {
            this._eventInput.emit('searchOnFocus',e);
        }
        else if  (e.target.className == 'cancel') {
            this._eventInput.emit('searchOnCancel');
        }
    }.bind(this));

    this._eventInput.on('searchOnFocus', this.searchOnFocus.bind(this));
    this._eventInput.on('searchOnCancel', this.searchOnCancel.bind(this));
    this.searchSurface.on('keyup', function(e){
        this.searchKey=this.getSearchKey();
        this.renderScrollView();
    }.bind(this));
};

ContactsScrollView.prototype.searchOnFocus = function(e){
    this.searchKey=this.getSearchKey();
    if (!this.searchKey) {
        this._eventInput.emit('backToNoneEditing');
        this.abcSurface.setContent('');
        this.scrollview.scrollTo(0,0);
        this.LayoutMod.setTransform(Transform.translate(0,-50,0), this.searhBarTransition);
//        $('.cancel').css('opacity',1);
        this.searchSurface._currTarget.children[0].children[0].children[2].style.opacity = 1;
        this.searchSurface._currTarget.children[0].children[0].children[2].style.display = 'inline';
        this.searchSurface._currTarget.children[0].style.paddingRight = "100px";
//        $('.contact-section-search-bar').addClass('search-mode');
        this.renderScrollView();
    }
};

ContactsScrollView.prototype.searchOnCancel = function(){
    this.abcSurface.setContent(Templates.abcButtons());
    this.LayoutMod.setTransform(Transform.translate(0,0,0), this.searhBarTransition)
//    $('.cancel').css('opacity',0);
    this.searchSurface._currTarget.children[0].children[0].children[2].style.opacity = 0;
    this.searchSurface._currTarget.children[0].children[0].children[2].style.display = 'none';
    this.searchSurface._currTarget.children[0].style.paddingRight = "10px";
//    $('.contact-section-search-bar').removeClass('search-mode');
    document.getElementsByClassName('search-contact')[0].value = '';
    this.searchKey=this.getSearchKey();
    this.renderScrollView();
};

ContactsScrollView.prototype.renderHeaders = function(){
    var existedAbcArray =  _.chain(this.collection.models)
                     .map(function(item){return item.get(this.sortKey)[0] || '#'}.bind(this))
                     .map(function(item){return (/^[a-zA-Z]+$/.test(item))? item.toUpperCase():'#'})
                     .uniq()
                     .value();
    _.each(this.headerSequence,function(item){
        (existedAbcArray.indexOf(item.options.header) == -1)? item.collapse() : item.expand()
    }.bind(this))
};

ContactsScrollView.prototype.getSearchKey = function() {
    if ($(document.activeElement).hasClass('search-contact')) return document.activeElement.value;
    else return false;
};

module.exports = ContactsScrollView;
