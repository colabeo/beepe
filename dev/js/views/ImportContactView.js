define(function(require, exports, module) {

    // Import core Famous dependencies
    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var Surface            = require('famous/core/Surface');
    var View               = require('famous/core/View');

    var SocialScrollView = require('views/SocialScrollView');

    function ImportContactView(options) {
        View.call(this);
        this.collection = options.collection;

        this.header = new Surface({
            content: '<button class="left back-button touchable">Back</button><div>' + options.title + ' Contacts</div>',
            classes: ['header'],
            size: [undefined, 50],
            properties: {
            }
        });
        this.content = new SocialScrollView({
            collection: this.collection
        });

        this.layout = new HeaderFooterLayout({
            headerSize: 50,
            footerSize: 0
        });

        this.layout.id.header.add(this.header);
        this.layout.id.content.add(this.content);

        this.header.pipe(this._eventOutput);
        this.content.pipe(this._eventOutput);

        this.header.on('click', function (e) {
            var target = $(e.target);
            if (target.hasClass(".edit-button")) {
                this.submitForm();
            }
        }.bind(this));

        this.header.on('click', function (e) {
            if ($(e.target).hasClass('back-button'))
                this._eventOutput.emit('goBack');
        }.bind(this));

        this._add(this.layout);
    }

    ImportContactView.prototype = Object.create(View.prototype);
    ImportContactView.prototype.constructor = ImportContactView;

    module.exports = ImportContactView;

});