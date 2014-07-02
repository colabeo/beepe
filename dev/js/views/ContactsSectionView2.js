define(function(require, exports, module) {

    // import famous modules
    var View               = require('famous/core/View');
    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var Utility            = require('famous/utilities/Utility');
    var Modifier           = require('famous/core/Modifier');
    var GenericSync        = require('famous/inputs/GenericSync');
    var Surface            = require('famous/core/Surface');
    var Easing             = require('famous/transitions/Easing');

    // import custom modules
//    var InputSync = require('custom-input-sync');
//    var TouchSync = InputSync.TouchSync;
//    var MouseSync = InputSync.MouseSync;
    var TouchSync = require('custom/TouchSync');
    var MouseSync = require('custom/MouseSync');
    var Templates = require('custom/Templates');
    var Transform = require('famous/core/Transform');

    // import views
    var VerticalScrollView = require('custom/VerticalScrollView');
    var ContactItemView    = require('views/ContactItemView');
    var RowView            = require('custom/RowView');
    var HeaderView         = RowView.HeaderView;

    function ContactsSection(options) {

        View.call(this);

        this.searchBarSize = 50;
        this.abcSurfaceWidth = 30;
        this.abcSurfaceHeight = undefined;
        this.a2zString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#';

        this.setupLayout(options);
        this.collectionEvents();
        this.abcSurfaceEvents();
        this.searchSurfaceEvents();
    }

    ContactsSection.prototype = Object.create(View.prototype);
    ContactsSection.prototype.constructor = ContactsSection;

    ContactsSection.prototype.setupLayout = function (options) {
        this.headerFooterLayout = new HeaderFooterLayout({
            headerSize: this.searchBarSize,
            footerSize: 0
        });
        this.LayoutMod = new Modifier();

        this.searchSurface = new Surface({
            size: [undefined, this.searchBarSize],
            classes: ['contact-section-search-bar'],
            content: '<div><i class="fa fa-search"></i>   ' +
                '<input type="text" class="search-contact" placeholder = "Search" ><span class="cancel">cancel</span></input></div></div>',
            properties: {
                backgroundColor: 'rgba(15,15,15,0.9)',
                color: 'white',
                zIndex: 10
            }
        });
        this.searchSurfaceMod = new Modifier({
            transform: Transform.translate(0, 0, 3)
        });
        this.searhBarTransition = {
            //        'curve' : Easing.linearNorm,
            'duration': 0
        };
        this.searchMode = false;

        this.abcSurface = new Surface({
            size: [this.abcSurfaceWidth, this.abcSurfaceHeight],
            classes: ['abcButton'],
            content: '<button id="A">A</button><button id="B">B</button><button id="C">C</button><button id="D">D</button><button id="E">E</button><button id="F">F</button><button id="G">G</button><button id="H">H</button><button id="I">I</button><button id="J">J</button><button id="K">K</button><button id="L">L</button><button id="M">M</button><button id="N">N</button><button id="O">O</button><button id="P">P</button><button id="Q">Q</button><button id="R">R</button><button id="S">S</button><button id="T">T</button><button id="U">U</button><button id="V">V</button><button id="W">W</button><button id="X">X</button><button id="Y">Y</button><button id="Z">Z</button><button id="#">#</button>',
            properties: {
                backgroundColor: 'rgba(160,160,160,0.0)',
                zIndex: 2
            }
        });
        this._eventInput.pipe(this.searchSurface);
        this.abcMod = new Modifier({
            origin: [1.0, 0.0],
            transform: Transform.translate(0, 0, 10)
        });

        this.title = '<button class="left edit-button" id="contact-edit-contact"></button><div>All Contacts</div><button class="right add-contact" id="add-contact"><i class="fa fa-plus" id="add-contact"></i></button>';
        this.navigation = {
            caption: 'Contacts',
            icon: '<i class="fa fa-users"></i>'
        };

        this.collection = options.collection;
        this.scrollview = new VerticalScrollView({
            direction: Utility.Direction.Y,
            margin: 10000

        });

        this.headerFooterLayout.id.header.add(this.searchSurfaceMod).add(this.searchSurface);
        this.headerFooterLayout.id.content.add(this.scrollview);
        this.headerFooterLayout.id.content.add(this.abcMod).add(this.abcSurface);

        this.pipe(this.scrollview);
        this._add(this.LayoutMod).add(this.headerFooterLayout);
    };

    ContactsSection.prototype.scrollTo = function (index, position) {
        if (index < 0) return;
        this.scrollview.setVelocity(0);
        this.scrollview.node.index = index;
        if (!position) position = 0;
        this.scrollview.setPosition(position);
    };

    ContactsSection.prototype.setupHeaderSurfaces = function () {
        return _.map(this.a2zString, function (i) {
            var headerSurface = new HeaderView({
                content: Templates.headerItemView(i, 0, 0),
                header: i,
                collection: this.collection
            });
            headerSurface.pipe(this.scrollview);
            return headerSurface;
        }.bind(this));
    };


    ContactsSection.prototype.refreshContacts = function (searchKey) {
        $('body').removeClass('editing');

        if (this.searchMode == true) {
            this.abcSurface.setContent('');
            this.currentSequence = [];
            if (searchKey == undefined || searchKey == '') {
                this.scrollview.sequenceFrom(this.currentSequence);
                return
            }
            this.currentCollection = this.collection.searchContact(searchKey.toUpperCase());
        } else {
            this.currentCollection = this.collection.models;
            this.currentSequence = _.clone(this.headerSequence);
            this.abcSurface.setContent(Templates.abcButtons());
        }

        this.contactSequence = _.sortBy(this.contactSequence, sortByLastname);
        this.currentContactsSequence = _.map(this.currentCollection, function (item) {
            return this.contactSequence[item.collection.indexOf(item)];
        }.bind(this));

        this.currentSequence = this.currentSequence.concat(this.currentContactsSequence);
        this.sortByLastname();

        // added empty item
        // media access bar messed up the height so add 40
        //
        //    var lastGroupIndex = _.last(this.a2zIndexArray);
        //    var extraHeight = this.scrollview.getSize()[1] + 40;
        //    for (var i = lastGroupIndex; i<this.sequence.length; i++) {
        //        extraHeight -= this.sequence[i].getSize()[1];
        //    }
        //
        //    if (extraHeight > 0) {
        //        var emptySurface = new Surface({
        //            size: [undefined, extraHeight]
        //        });
        //        this.sequence.push(emptySurface);
        //        emptySurface.pipe(this.eventOutput);
        //
        //        if (this.collection.length == 0) {
        //            var firstAdd = '<div class="firstAdd"><div> <i class="fa fa-plus fa-5x" ></i> </div> <div> Your contact list is empty,</div><div> Please add your first contact</div></div>';
        //            emptySurface.setContent(firstAdd);
        //            emptySurface.on('click',function(e){
        //                if ($(e.target).hasClass('fa-plus'))
        //                    this.eventOutput.emit('editContact');
        //            }.bind(this))
        //        } else if (this.currentCollection.length == 0) {
        //            var noMatch = '<div class="no-match-found"><div> No match found</div></div>';
        //            emptySurface.setContent(noMatch);
        //        }
        //    }

        this.scrollview.sequenceFrom(this.currentSequence);
    };

    ContactsSection.prototype.initContacts = function () {

        this.headerSequence = this.setupHeaderSurfaces();
        this.contactSequence = this.collection.map(function (item) {
            return this.createItem(item);
        }.bind(this));
        this.refreshContacts();
    };

    ContactsSection.prototype.createItem = function (item) {
        var surface = new ContactItemView({model: item});
        surface.pipe(this._eventOutput);
        this._eventInput.pipe(surface);
        return surface;
    };

    ContactsSection.prototype.collectionEvents = function () {
        // When Firebase returns the data switch out of the loading screen
        this.collection.on('all', function (e, model, collection, options) {
            console.log(e, model, collection, options);
            switch (e) {
                case 'change':
                    this.changeItem(model);
                    this.collection.sort();
                    break;
                case 'remove':
                    this.removeItem(model);
                    break;
                case 'add':
                    if (this.noInit == true) {
                        this.addItem(model);
                    }
                    break;
                case 'sync':
                    if (!this.noInit) {
                        this.noInit = true;
                        this.initContacts();
                    }
                    break;

            }
        }.bind(this));
    };

    ContactsSection.prototype.abcSurfaceEvents = function () {
        var mousePosition = [0, 0];
        var sync = new GenericSync(function () {
            return mousePosition;
        }, {
            syncClasses: [MouseSync, TouchSync]
        });
        this.abcSurface.pipe(sync);
        sync.on('start', function (data) {
            this.scrollToContact(data);
        }.bind(this));
        sync.on('update', function (data) {
            this.scrollToContact(data);
        }.bind(this));
    };

    ContactsSection.prototype.scrollToContact = function (data) {
        var target = document.elementFromPoint(data.ap[0], data.ap[1]);
        if (!target || !target.id) return;

        for (var i in this.headerSequence) {
            if (this.headerSequence[i].options.header == target.id) {
                var index = this.currentSequence.indexOf(this.headerSequence[i]);
                break;
            }
        }
        this.scrollTo(index);
    };

    ContactsSection.prototype.removeItem = function (item) {
        for (var i in this.contactSequence) {
            if (this.contactSequence[i].model == item) {
                var indexInContactSequence = i;
                break
            }
        }
        this.contactSequence.splice(indexInContactSequence, 1);

        for (var i in this.currentSequence) {
            if (this.currentSequence[i].model == item) {
                var indexInScrollview = i;
                break
            }
        }
        this.scrollview.removeByIndex(indexInScrollview);
    };

    ContactsSection.prototype.addItem = function (item) {
        var newContact = this.createItem(item);
        this.contactSequence.push(newContact);
        this.refreshContacts();
    };

    ContactsSection.prototype.changeItem = function (item) {
        this.refreshContacts();
    };

    ContactsSection.prototype.searchSurfaceEvents = function () {
        this.searchSurface.on('click', function (e) {
            //        console.log(e);
            if (e.target.className == 'search-contact') {
                this._eventInput.emit('searchOnFocus');
            }
            else if (e.target.className == 'cancel') {
                e.currentTarget.children[0].children[1].value = '';
                this._eventInput.emit('searchOnBlur');
                this.refreshContacts('');
            }
        }.bind(this));

        this._eventInput.on('searchOnFocus', this.searchOnFocus.bind(this));
        this._eventInput.on('searchOnBlur', this.searchOnBlur.bind(this));
        this.searchSurface.on('keyup', function (e) {
            this.refreshContacts(e.target.value);
        }.bind(this));
    };

    ContactsSection.prototype.getInitialChar = function (item) {
        if (item.get('lastname') != undefined && item.get('lastname') != '') {
            return isEnglish(item.get('lastname')) ? item.get('lastname')[0].toUpperCase() : '#';
        } else {
            return '#';
        }

        function isEnglish(words) {
            return /^[a-zA-Z]+$/.test(words[0])
        }
    };

    ContactsSection.prototype.searchOnFocus = function () {
        this.searchMode = true;
        this._eventInput.emit('backToNoneEditing');
        this.scrollview.scrollTo(0, 0);
        this.refreshContacts();
        this.LayoutMod.setTransform(Transform.translate(0, -50, 0), this.searhBarTransition);
        this.searchSurface._currTarget.children[0].children[2].style.opacity = 1;
        this.searchSurface._currTarget.style.paddingRight = "100px";
        //    colabeo.app.header.collapse();
    };
    ContactsSection.prototype.searchOnBlur = function () {
        this.searchMode = false;
        this.LayoutMod.setTransform(Transform.translate(0, 0, 0), this.searhBarTransition)
        this.searchSurface._currTarget.children[0].children[2].style.opacity = 0;
        this.searchSurface._currTarget.style.paddingRight = "10px";
        //    colabeo.app.header.expand();
    };

    ContactsSection.prototype.sortByLastname = function () {
        this.currentSequence = _.sortBy(this.currentSequence, sortByLastname);
    };

    ContactsSection.prototype.sortByFirstname = function () {
        this.currentSequence = _.sortBy(this.currentSequence, sortByFirstname);
    };

    function sortByLastname(item) {
        var l, f, h;
        l = f = h = '';
        if (item.model) l = item.model.get('lastname');
        if (item.model) f = item.model.get('firstname');
        if (item.options && item.options.header) h = item.options.header;
        var str = h + l + ' ' + f;
        if (!/^[a-zA-Z]+$/.test(str[0]))
            str = "zzzz" + str;
        return str.toUpperCase();
    }

    function sortByFirstname(item) {
        var l, f, h;
        l = f = h = '';
        if (item.model) l = item.model.get('lastname');
        if (item.model) f = item.model.get('firstname');
        if (item.options && item.options.header) h = item.options.header;
        var str = h + f + ' ' + l;
        if (!/^[a-zA-Z]+$/.test(str[0]))
            str = "zzzz" + str;
        return str.toUpperCase();
    }

    function dynamicSort(sortFunction) {
        return function (a, b) {
            var result = (sortFunction(a) < sortFunction(b)) ? -1 : (sortFunction(a) > sortFunction(b)) ? 1 : 0;
            return result;
        }
    }

    module.exports = ContactsSection;

});
