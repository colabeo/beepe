var Settings = require('settings');

module.exports = Backbone.Model.extend({
    defaults: {
        content: "",
        type: "text",
        time: "",
        source: "",
        from: ""
    },
    isLocal: function () {
        var appSettings = Settings.getAppSettings();
        var cid = appSettings.get('cid'); // window._cola_g.cid;
        return this.get('source') == 'local' || this.get('from') == cid;
    }
});
