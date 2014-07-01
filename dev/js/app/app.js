// import famous dependencies
var View               = require('famous/view');
var EventHandler       = require('famous/event-handler');
var RenderNode         = require('famous/render-node');
var Utility            = require('famous/utilities/utility');
var Matrix             = require('famous/transform');
var HeaderFooterLayout = require('famous/views/header-footer-layout');
var EdgeSwapper        = require('famous/views/edge-swapper');
var TabBar             = require('famous/widgets/tab-bar');
//var TitleBar           = require('famous/widgets/title-bar');
var Templates          = require('templates');
var RowView     = require('row-view');
var HeaderBar   = RowView.HeaderBar;

function App(options) {
    // extend from view
    View.apply(this, arguments);

    // create the layout
    this.layout = new HeaderFooterLayout();

    // create the header
    this.header = new HeaderBar(this.options.header);

    // create the navigation bar
    this.navigation = new TabBar(this.options.navigation);

    // create the content area
    this.contentArea = new EdgeSwapper(this.options.content);

    // link endpoints of layout to widgets
    this.layout.id['header'].add(this.header);
    this.layout.id['footer'].add(Utility.transformInFront).add(this.navigation);
    this.layout.id['content'].add(Utility.transformBehind).add(this.contentArea);

    // assign received events to content area
    this._eventInput.pipe(this.contentArea);

    // navigation events are app events
    EventHandler.setOutputHandler(this, this.navigation)
    this._eventInput = new EventHandler();
    EventHandler.setInputHandler(this, this._eventInput);
    this._eventOutput = new EventHandler();
    EventHandler.setOutputHandler(this, this._eventOutput);

    // declare the render nodes
    this._currentSection = undefined;
    this._sections = {};
    this._sectionTitles = {};

    // Initialize sections if they were passed at instantiation time
    this.options.sections && this.initSections(this.options.sections);

    // respond to the the selection of a different section
    this.navigation.on('select', function(data) {
        this._eventOutput.emit('triggerBackToNoneEditing');
        this._eventOutput.emit('updateRecent');
        $('body').removeClass('editing');
        this._currentSection = data.id;
        this.header.show(this._sectionTitles[data.id]);
        this.contentArea.show(this._sections[data.id].get());
//            if (!this.header._surfaces[data.id].eventHandled) this.onHeaderClick(data);
    }.bind(this));

    var recentsChats = options.sections[0].collection;
    recentsChats.on('all', function(e, model) {
        var badge = recentsChats.getUnreadCount() || '';
        var badgeButton = $(this.navigation.buttons[0].options.content);
        badgeButton.find('.badge').text(badge);
        this.navigation.buttons[0].setOptions({content: badgeButton[0].outerHTML});
    }.bind(this));

    // assign the layout to this view
    this._add(this.layout);
}
App.prototype = Object.create(View.prototype);
App.prototype.constructor = App;

App.DEFAULT_OPTIONS = {
    header: {
        size: [undefined, 50],
        inTransition: true,
        outTransition: true,
        look: {
            size: [undefined, 50],
            classes: ['header']
        }
    },
    navigation: {
        size: [undefined, 50],
        direction: Utility.Direction.X,
        buttons: {
            onClasses: ['navigation', 'on'],
            offClasses: ['navigation', 'off'],
            inTransition: true,
            outTransition: true
        }
    },
    content: {
        inTransition: true,
        outTransition: true,
        overlap: true
    },
    inTransform: Matrix.identity,
    outTransform: Matrix.identity,
    inOpacity: 0,
    outOpacity: 0,
    inTransition:{duration: 500},
    outTransition:{duration: 200}
};

App.prototype.getState = function() {
    return this._currentSection;
};

App.prototype.section = function(id) {
    // create the section if it doesn't exist
    if(!(id in this._sections)) {
        this._sections[id] = new RenderNode();

        // make it possible to set the section's properties
        this._sections[id].setOptions = (function(options) {
            this._sectionTitles[id] = options.title;
            this.navigation.defineSection(id, {
                content: Templates.navigationButton(options.navigation)
            });
        }).bind(this);
    }
    return this._sections[id];
};

App.prototype.select = function(id) {
    this._currentSection = id;
    if(!(id in this._sections)) return false;
    this.navigation.select(id);
    return true;
};

// Initialize the sections that were passed in
App.prototype.initSections = function(sections) {
    _.each(sections, function(item) {
        var id = item.title;
        this.section(id).setOptions({
            title: item.title,
            navigation: item.navigation
        });
        this.section(id).add(item);

        if(item.pipe) {
            item.pipe(this._eventInput);
        }
    }.bind(this));
};

App.prototype.onHeaderClick = function(data){
    this.header._surfaces[data.id].eventHandled = true;
    this.header._surfaces[data.id].on('click', function(e){
        switch (e.target.id)
        {
            case 'clear-button':
                this._eventOutput.emit('clearRecent');
                break;
            case 'add-contact':
                this._eventOutput.emit('editContact');
                break;
            case 'edit-contact':
                $('body').toggleClass('editing');
                break;
            case 'recent-toggle':
                this._eventOutput.emit('loadRecent', e);
                break;
        }
    }.bind(this));
    this.header._surfaces[data.id].pipe(this._eventOutput);
};

module.exports = App;
