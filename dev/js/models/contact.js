// Generic Backbone Model

define(function(require, exports, module) {

    module.exports = Backbone.Model.extend({
        whiteList: ['email', 'firstname', 'lastname', 'id', 'cid', 'dcr', 'favorite', 'phone', 'facebook', 'google', 'linkedin', 'github', 'twitter'],
        toJSON: function (options) {
            return _.pick(this.attributes, this.whiteList);
        },
        toggleFavorite: function () {
            this.set({
                favorite: !this.get("favorite")
            });
        }
    });

});
