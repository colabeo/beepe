define(function(require, exports, module) {

    // import famous modules
    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var Surface            = require('famous/core/Surface');
    var EventHandler       = require('famous/core/EventHandler');
    var View               = require('famous/core/View');
    var EdgeSwapper        = require('famous/views/EdgeSwapper');

    //import custom modules
    var UpDownTransform = require('custom/UpDownTransform');
    var Templates       = require('custom/Templates');
    var Helpers         = require('custom/Helpers');
    var Models          = require("models");
    var Settings        = Models.Settings;

    // import models
    var Models  = require("models");
    var Contact = Models.Contact;
    var SocialContactCollection = Models.SocialContactCollection;

    // import views
    var ImportContactView = require('views/ImportContactView');

    function AddContactView(options) {
        View.call(this);
        this.formObject = {};
        this.socialCollection = {};
        this.socialView = {};
        this.headerFooterLayout = new HeaderFooterLayout({
            headerSize: 50,
            footerSize: 0
        });
        var upDownTransform = new UpDownTransform;

        if (options.inTransform === undefined) this.options.inTransform = upDownTransform.options.inTransform;
        if (options.outTransform === undefined) this.options.outTransform = upDownTransform.options.outTransform;
        if (options.inTransition === undefined) this.options.inTransition = upDownTransform.options.inTransition;
        if (options.outTransition === undefined) this.options.outTransition = upDownTransform.options.outTransition;
        if (options.inOpacity === undefined) this.options.inOpacity = upDownTransform.options.inOpacity;
        if (options.outOpacity === undefined) this.options.outOpacity = upDownTransform.options.outOpacity;
        this.options.showOrigin = [0, 0];
        this.options.inOrigin = [0, 0];
        this.options.outOrigin = [0, 0];

        this.model = options.model;

        // Set up event handlers
        // this.eventInput = new EventHandler();
        // EventHandler.setInputHandler(this, this.eventInput);
        // this.eventOutput = new EventHandler();
        // EventHandler.setOutputHandler(this, this.eventOutput);

        this.header = new Surface({
            classes: ['header'],
            size: [undefined, 50],
            properties: {
            }
        });
        this.content = new Surface({
            classes: ['add-contact-view'],
            size: [undefined, undefined],
            properties: {
                'padding': '20px',
                backgroundColor: 'transparent'
            }
        });

        this.headerFooterLayout.id.header.add(this.header);
        this.headerFooterLayout.id.content.add(this.content);

        var edgeSwapper = new EdgeSwapper();

        this._add(edgeSwapper);
        edgeSwapper.show(this.headerFooterLayout);

        this.content.pipe(this._eventOutput);
        this.header.pipe(this._eventOutput);

        this.renderContact();

        this.header.on('click', function (e) {
            var target = $(e.target);
            if (target.hasClass("done-contact")) {
                this.submitForm();
                $('body').removeClass('editing');
                this._eventOutput.emit('triggerBackToNoneEditing');
                this._eventOutput.emit('showApp');
            } else if (target.hasClass("close-button")) {
                this._eventOutput.emit('showApp');
            }
        }.bind(this));

        this.collection = options.collection;

        this.content.on('click', function (e) {
            var target = $(e.target);

            function onDataHandler() {
                if (!this.socialView[source]) {
                    if (_.isArray(this.socialCollection[source].models)) {
                        //TODO: pull collections from server
                        this.socialView[source] = new ImportContactView({
                            title: Helpers.capitalize(source),
                            collection: this.socialCollection[source]});
                        this.socialView[source].pipe(this._eventOutput);
                    } else {
                        alert("Your " + source + " contact list is empty.");
                        return;
                    }
                }
                edgeSwapper.show(this.socialView[source], true);
            }

            function onErrorHandler() {
                this._eventOutput.emit('onSocialLink', source);
                delete this.socialCollection[source];
                //                    alert("Go to Settings and link before adding " + _(source).capitalize() + " contact.");
            }

            if (target.hasClass('import-contact')) {
                var source = target[0].id;
                if (!this.socialCollection[source]) {
                    this.socialCollection[source] = new SocialContactCollection();
                    this.socialCollection[source].url = '/contact/' + source;
                    this.socialCollection[source].fetch({
                        success: onDataHandler.bind(this),
                        error: onErrorHandler.bind(this)
                    });
                } else {
                    onDataHandler.bind(this)();
                }

            } else if (target.hasClass('remove-button')) {
                var source = target[0].id;
                if (source)
                    delete this.formObject[source];
                this.renderContact();
            }
            //        else if (target.hasClass('invite-button')) {
            //            $.oauthpopup({
            //                path: target.attr('href')
            //            });
            //        }

        }.bind(this));

        //        this.eventOutput.on('importSource', onImportSource);
        this._eventOutput.on('goBack', onGoBack);

        function onImportSource(eventData) {
            if (!eventData || !eventData.attributes) return;
            this.getFormObject();
            if (eventData.attributes.provider) {
                this.formObject[eventData.attributes.provider] = eventData.attributes;
            } else {
                this.formObject = _.extend(this.formObject, eventData.attributes);
            }
            this.formObject.firstname = this.formObject.firstname ? this.formObject.firstname : eventData.attributes.firstname;
            this.formObject.lastname = this.formObject.lastname ? this.formObject.lastname : eventData.attributes.lastname;
            this.formObject.email = this.formObject.email ? this.formObject.email : eventData.attributes.email;
            this.renderContact();
        }

        function onGoBack(eventData) {
            edgeSwapper.show(this.headerFooterLayout, true, function () {
                onImportSource.bind(this)(eventData);
            }.bind(this));
        }
    }

    AddContactView.prototype = Object.create(View.prototype);
    AddContactView.prototype.constructor = AddContactView;

    AddContactView.prototype.renderContact = function () {
        var html = '<div class="initial">' + this.initial + '</div>';
        html += '<form role="form">';
        html += '<div class="form-group small">';
        html += '<input type="text" class="form-control" id="input-first-name" placeholder="First" name="firstname"';
        if (this.formObject.firstname)
            html += ' value="' + this.formObject.firstname + '"';
        html += '></div>';
        html += '<div class="form-group small">';
        html += '<input type="text" class="form-control" id="input-last-name" placeholder="Last" name="lastname"';
        if (this.formObject.lastname)
            html += ' value="' + this.formObject.lastname + '"';
        html += '></div>';
        html += '<div class="form-group small">';
        html += '<input type="email" class="form-control" id="input-email" placeholder="Email" name="email"';
        if (this.formObject.email) {
            html += ' value="' + this.formObject.email + '">';
            html += Templates.getEmailInvite(this.formObject);
            html += '</div>';
        } else {
            html += '></div>';
        }
        html += '<div class="form-group small">';
        html += '<input type="phone" class="form-control" id="input-phone" placeholder="Phone" name="phone"';
        if (this.formObject.phone) {
            html += ' value="' + this.formObject.phone + '">';
            html += Templates.getSMSInvite(this.formObject);
            html += '</div>';
        } else {
            html += '></div>';
        }
        //TODO: this is a hack. we used the same class "import-contact" and id for a target.
        html += '<div class="box">';

        html += Templates.addSocialContact(this.formObject, 'google');
        html += Templates.addSocialContact(this.formObject, 'facebook');
        html += Templates.addSocialContact(this.formObject, 'twitter');
        html += Templates.addSocialContact(this.formObject, 'linkedin');
        //    html += Templates.addSocialContact(this.formObject, 'github');
        //    html += Templates.addSocialContact(this.formObject, 'yammer');

        html += Templates.getInvite(this.formObject);
        html += '</div></form>';

        this.content.setContent(html);

        var html = Templates.editContactHeader(this.title);
        this.header.setContent(html);
    };

    AddContactView.prototype.getFormObject = function () {
        var formArr = $('.add-contact-view form').serializeArray();
        var formContact = {};
        for (var i in formArr) {
            if (formArr[i].name) formContact[formArr[i].name] = formArr[i].value;
        }
        this.formObject = _.extend(this.formObject, formContact);
        // remove undefined attributes
        for (var i in this.formObject) {
            if (this.formObject[i] === undefined) delete this.formObject[i];
        }
        return this.formObject;
    };

    AddContactView.prototype.submitForm = function () {
        var formContact = this.getFormObject();
        if (this.title == 'Edit Contact') {
            this.model.set(formContact);
            this._eventOutput.emit('submitContact', this.model);
        } else {
            var contactObj = this.collection.create(formContact);
            var contact = this.collection.findWhere({id: contactObj.id})
            this._eventOutput.emit('submitContact', contact);
        }
        // trigger contact list redraw
        this.collection.trigger('sync');
    };

    AddContactView.prototype.setContact = function (model) {
        if (model && model instanceof Contact) {
            this.formObject = _.omit(model.attributes, 'id');
            this.title = 'Edit Contact';
            this.initial = '';
            if (this.formObject.firstname)
                this.initial = this.formObject.firstname[0];
            if (this.formObject.lastname)
                this.initial += this.formObject.lastname[0];
            this.model = model;
        } else {
            this.formObject = {};
            if (model) this.formObject = _.omit(model.attributes, 'id');
            this.title = 'New Contact';
            this.initial = '<i class="fa fa-user fa-lg"></i>';
        }
    };

    module.exports = AddContactView;

});