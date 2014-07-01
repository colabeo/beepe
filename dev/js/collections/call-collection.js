// Import app specific dependencies
var Call = require('call');

module.exports = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("colabeo-call-collection"),
    model: Call,

    missed: function() {
        return this.filter(function(item){ return item.isMissed(); });
    },

    all: function() {
        return this.filter(function(item){ return true; });
    },

    comparator: function(model) {
        return -1*model.get('time');
    }
});
