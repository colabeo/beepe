define(function(require, exports, module) {

    var ContactsScrollView = require('views/ContactsScrollView');
    var Templates          = require('custom/Templates');

    function ContactsSection(options) {
        ContactsScrollView.apply(this, arguments);

        this.title = Templates.contactHeader();
        this.navigation = {
            caption: 'Contacts',
            icon: '<i class="fa fa-users"></i>'
        };
    }

    ContactsSection.prototype = Object.create(ContactsScrollView.prototype);
    ContactsSection.prototype.constructor = ContactsSection;

    module.exports = ContactsSection;

});