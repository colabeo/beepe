define(function(require, exports, module) {

    // Import app specific dependencies
    var Conversation = require('models/Conversation');

    module.exports = Backbone.Firebase.Collection.extend({

        model: Conversation,

        comparator: function (model) {
            return 1 * model.get('time');
        }
    });

});
