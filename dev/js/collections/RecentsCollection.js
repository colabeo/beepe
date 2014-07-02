define(function(require, exports, module) {

    // Import app specific dependencies
    var Call = require('models/Call');

    module.exports = Backbone.Firebase.Collection.extend({

        model: Call,

        missed: function () {
            return this.filter(function (item) {
                return item.isMissed();
            });
        },

        all: function () {
            return this.filter(function (item) {
                return true;
            });
        },

        comparator: function (model) {
            return -1 * model.get('time');
        },

        getUnreadCount: function () {
            return this.filter(function (item) {
                return !item.get('read');
            }).length;
        }
    });

});
