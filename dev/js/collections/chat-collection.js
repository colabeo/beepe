// Import app specific dependencies
var Conversation = require('conversation');

module.exports = Backbone.Firebase.Collection.extend({

    model: Conversation,

    comparator: function(model){
        return 1*model.get('time');
    }
});
