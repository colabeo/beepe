//Import app specific dependencies
var Conversation = require('conversation');

module.exports = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("colabeo-chat-colection"),
    model: Conversation,

    comparator: function(model){
        return 1*model.get('time');
    }

});