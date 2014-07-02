define(function(require, exports, module) {

    // Import core Famous dependencies
    var View       = require('famous/core/View');
    var Utility    = require('famous/utilities/Utility');
    var Surface    = require('famous/core/Surface');
    var Scrollview = require('famous/views/Scrollview');
    var Templates  = require('custom/Templates');

    function SettingsSectionView(options) {
        View.call(this);
        this.appSettings = options.model;

        // Set up navigation and title bar information
        this.title = '<div>Settings</div>';
        this.navigation = {
            caption: 'Settings',
            icon: '<i class="fa fa-gear"></i>'
        };
        this.scrollview = new Scrollview({
            direction: Utility.Direction.Y,
            margin: 10000
        });
        this.pipe(this.scrollview);
        this.surface = new Surface({
            properties: { 'padding': '20px' },
            size: [undefined, 700]
        });
        this.template();
        this.surface.pipe(this._eventOutput);
        this.scrollview.sequenceFrom([this.surface]);
        this._add(this.scrollview);

        function onPermissionGranted() {
            myNotification.show();
        }

        function onPermissionDenied() {
            if (this.appSettings.get('notification')) {
                alert('Unblock notification for beepe.me:443 in chrome://settings/contentExceptions#notifications');
                this.appSettings.set('notification', false);
                $('#notification').prop('checked', false);
            }
        }

        var myNotification = new Notify('Settings', {
            body: 'Notification is on.',
            tag: 'notificationSettings',
            permissionGranted: onPermissionGranted.bind(this),
            permissionDenied: onPermissionDenied.bind(this)
        });

        $(document).on('click', '#notification', function () {
            this.appSettings.save({notification: JSON.parse($("#notification").prop('checked'))});
            if (!this.appSettings.get('notification')) return;
            if (myNotification.needsPermission()) {
                myNotification.requestPermission();
            } else {
                myNotification.show();
            }
        }.bind(this));
        this.surface.on('click', function (e) {
            //TODO: dont know why the surface is call twice: first time for the surface and the second time for the toggle button.
            //            console.log(e);
            switch (e.target.id) {
                case "camera":
                    this.appSettings.save({camera: JSON.parse($("#camera").prop('checked'))});
                    break;
                case "video":
                    this.appSettings.save({video: JSON.parse($("#video").prop('checked'))});
                    break;
                case "audio":
                    this.appSettings.save({audio: JSON.parse($("#audio").prop('checked'))});
                    break;
                case "blur":
                    this.appSettings.save({blur: JSON.parse($("#blur").prop('checked'))});
                    break;
                case "facebook":
                case "google":
                case "twitter":
                case "linkedin":
                    if (JSON.parse($("#" + e.target.id).prop('checked')))
                        this._eventOutput.emit('onSocialLink', e.target.id);
                    else
                        window.location = "/disconnect/" + e.target.id;
                    break;
                case "github":
                case "yammer":
                    alert("Coming Soon.");
                    break;
            }
        }.bind(this));

        this.surface.on('click', function (e) {
            if ($(e.target).hasClass('logout-button')) {
                window.location = "/logout";
            }
            //        switch (e.target.className)
            //        {
            ////                case "call-button":
            ////                    this.eventOutput.emit('outgoingCall');
            ////                    break;
            ////                case "incoming-button":
            ////                    this.eventOutput.emit('imcomingCall');
            ////                    break;
            //            case "connected-button":
            //                this._eventOutput.emit('connectedCall', 'o9ycaGmnq0');
            //                break;
            //            case "conversations-button":
            //                this._eventOutput.emit('conversations');
            //                break;
            //        }
        }.bind(this));

        var settingsEvents = {
            'change:camera': onCamera.bind(this),
            'change:audio': onAudio.bind(this),
            'change:video': onVideo.bind(this),
            'change:blur': onBlur.bind(this),
            'change': onChange.bind(this)
        };
        this.appSettings.on(settingsEvents);

        function onChange() {
            this.template();
        }

        function onCamera() {
            console.log('camera change');
            //            $("#camera").prop('checked', this.appSettings.get('camera'));
            this._eventOutput.emit('setCamera');
        }

        function onAudio() {
            console.log('audio change');
            //            $("#audio").prop('checked', this.appSettings.get('audio'));
            this._eventOutput.emit('setAudio');
        }

        function onVideo() {
            console.log('video change');
            //            $("#video").prop('checked', this.appSettings.get('video'));
            this._eventOutput.emit('setVideo');
        }

        function onBlur() {
            console.log('blur change');
            //            $("#blur").prop('checked', this.appSettings.get('blur'));
            this._eventOutput.emit('setBlur');
        }
    }

    SettingsSectionView.prototype = Object.create(View.prototype);
    SettingsSectionView.prototype.constructor = SettingsSectionView;
    SettingsSectionView.prototype.template = function () {
        this.surface.setContent(Templates.settingsPage(this.appSettings));
    };

    module.exports = SettingsSectionView;

});
