// Generic Backbone Model
var Settings = Backbone.Model.extend({
    // if url changed, need new name for the localstorage
    localStorage: new Backbone.LocalStorage("colabeo-settings-1"),
    defaults: {
        cid: "default",
        email: "default@colabeo.com",
        linkAccounts: {
            facebook: false,
            google: false,
            twitter: false,
            linkedin: false,
            github: false,
            yammer: false
        },
        firstname: "John",
        lastname: "Colabeo",
        notification: false,
        camera: true,
        video: true,
        audio: true,
        blur: undefined,
        firebaseUrl: "https://colabeo.firebaseio.com/",
        pHost: "dashboard.colabeo.com",
        pPort: 9000,
        pSecure: true
    }
});
module.exports = Settings;
module.exports.getAppSettings =_.memoize(function(data) {
    if (data) {
        this.appSettings = new Settings({
            id: data.objectId
        });
        this.appSettings.fetch();
        this.appSettings.save({
            cid: data.objectId,
            email: data.email || "",
            firstname: data.firstname || data.username || "",
            lastname: data.lastname || "",
            username: data.username || ""
        });
        this.appSettings.me = data;
    }
    return this.appSettings;
});
