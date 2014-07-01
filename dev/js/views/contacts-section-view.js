var ContactsScrollView = require('contacts-scroll-view');
var Templates        = require('templates');

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
