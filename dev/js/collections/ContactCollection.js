define(function(require, exports, module) {

    // Import app specific dependencies
    var Contact = require('models/Contact');

    module.exports = Backbone.Firebase.Collection.extend({

        model: Contact,

        favorites: function () {
            return this.filter(function (item) {
                return item.get('favorite');
            });
        },

        searchContact: function (keyword) {
            return this.filter(function (item) {
                if (item.get('firstname').toUpperCase().indexOf(keyword) != -1 || item.get('lastname').toUpperCase().indexOf(keyword) != -1)
                    return item.get('firstname');
            });
        },

        searchContactByEmail: function (keyword) {
            return this.filter(function (item) {
                if (item.get('email').toUpperCase().indexOf(keyword) != -1) {
                    return item.get('email');
                }
            })
        },

        lastnameInitial: function (keyword) {
            return this.filter(function (item) {
                var firstChar;
                if (item.get('lastname')) {
                    firstChar = isEnglish(item.get('lastname')) ? item.get('lastname')[0].toUpperCase() : '#';
                    return firstChar == keyword;
                } else if (item.get('firstname')) {
                    firstChar = isEnglish(item.get('firstname')) ? item.get('firstname')[0].toUpperCase() : '#';
                    return firstChar == keyword;
                } else if (item.get('email')) {
                    firstChar = isEnglish(item.get('email')) ? item.get('email')[0].toUpperCase() : '#';
                    return firstChar == keyword;
                }
            });
            function isEnglish(words) {
                return /^[a-zA-Z]+$/.test(words[0])
            }
        },

        comparator: function (model) {
            var l = model.get('lastname');
            var f = model.get('firstname');
            if (!/^[a-zA-Z]+$/.test(l[0]))
                l = "zzzz" + l;
            return (l + " " + f).toUpperCase();
        }
    });

});
