define(function(require, exports, module) {

    module.exports = Backbone.Model.extend({
        defaults: {
            firstname: "John",
            lastname: "Doe",
            email: "",
            phone: "",
            pictureUrl: "",
            // TODO: hack, need to fix
            cid: "testcid"
        },
        isMissed: function () {
            return !this.get('success') && this.get('type') == 'incoming';
        }
    });

});