define(function(require, exports, module) {
    // import famous dependencies
    var FamousEngine = require('famous/core/Engine');
    var Surface      = require('famous/core/Surface');
    var EventHandler = require('famous/core/EventHandler');
    var Easing       = require('famous/transitions/Easing');

    var Helpers  = require('custom/Helpers');
    var LightBox = require('custom/LightBox');

    // import models
    var Contact  = require("models/Contact");
    var Call     = require("models/Call");
    var Settings = require("models/Settings");


    var CallCollection    = require("collections/CallCollection");
    var ContactCollection = require('collections/ContactCollection');

    // import views
    var AlertView         = require('views/AlertView');
    var CameraView        = require("views/CameraView");
    var AddContactView    = require("views/AddContactView");
    var OutgoingCallView  = require("views/OutgoingCallView");
    var IncomingCallView  = require("views/IncomingCallView");
    var ConnectedCallView = require('views/ConnectedCallView');

    var FavoritesSectionView = require('views/FavoritesSectionView');
    var ChatsSectionView     = require('views/ChatsSectionView');
    var RecentsSectionView   = require('views/RecentsSectionView');
    var ContactsSectionView  = require('views/ContactsSectionView');
    var DialSectionView      = require('views/DialSectionView');
    var SettingsSectionView  = require('views/SettingsSectionView');

    // import app
    var config = require('app/Config');
    var App    = require('app/App');

    var defaultIceConfig = {'iceServers': [
        { url: 'stun:stun.l.google.com:19302' }
    ]};

    function MainController() {
        // Set up event handlers
        this._eventInput = new EventHandler();
        EventHandler.setInputHandler(this, this._eventInput);
        this._eventOutput = new EventHandler();
        EventHandler.setOutputHandler(this, this._eventOutput);

        this.loadUser(function(data) {

            if (data.chatroom) {
                this.chatroom = data.chatroom;
                data.objectId = 'dcr' + data.chatroom.objectId;
                data.firstname = data.chatroom.calleeFirstName;
                data.lastname = data.chatroom.calleeLastName;
                data.username = data.chatroom.calleeName;
            }
            // Set up models and collections
            this.appSettings = Settings.getAppSettings(data);

            this.contactCollection = new ContactCollection([], {
                firebase: this.appSettings.get('firebaseUrl') + 'users/' + this.appSettings.get('cid')+'/contacts'
            });
            this.recentCalls = new RecentsCollection([], {
                firebase: this.appSettings.get('firebaseUrl') + 'history/' + this.appSettings.get('cid')+'/calls'
            });
            this.recentChats = new RecentsCollection([], {
                firebase: this.appSettings.get('firebaseUrl') + 'history/' + this.appSettings.get('cid')+'/chats'
            });
            this.curCall = new Call();

            // preload facebook contacts
            if (!localStorage.getItem('preloadfb'+this.appSettings.get('cid'))) {
                this.contactCollection.once("sync", function(e){
                        setTimeout( function(){
                                this.loadContact('facebook', this.saveContact.bind(this));
                            }.bind(this),
                        400);
                }.bind(this));
            }
    //        var fb = [];
    //        colabeo.contactCollection.each(
    //            function(i){
    //                if (i.get('facebook')) {
    //                    if (fb.indexOf(i.get('facebook').id)==-1)
    //                        fb.push(i.get('facebook').id);
    //                    else
    //                        colabeo.contactCollection.remove(i);
    //                }
    //            }
    //        );

            // Set up views
            var favoritesSection = new FavoritesSectionView({
                collection: this.contactCollection
            });
            var chatsSection = new ChatsSectionView({
                collection: this.recentChats
            });
            var recentsSection = new RecentsSectionView({
                collection: this.recentCalls
            });
            var contactsSection = new ContactsSectionView({
                collection: this.contactCollection
            });
            var dialSection = new DialSectionView({
                collection: this.contactCollection
            });
            var settingsSection = new SettingsSectionView({
                model: this.appSettings
            });
            favoritesSection.pipe(this._eventOutput);
            this._eventInput.pipe(favoritesSection);
            chatsSection.pipe(this._eventOutput);
            this._eventInput.pipe(chatsSection);
            recentsSection.pipe(this._eventOutput);
            this._eventInput.pipe(recentsSection);
            contactsSection.pipe(this._eventOutput);
            this._eventInput.pipe(contactsSection);
            dialSection.pipe(this._eventOutput);
            this._eventInput.pipe(dialSection);
            settingsSection.pipe(this._eventOutput);

            // Config and initialize app
            config.sections = [
                chatsSection,
                recentsSection,
                contactsSection,
                dialSection,
                settingsSection
            ];
    //        if (!Helpers.isMobile()) config.sections.splice(3,0,dialSection);

            // create the App from the template
            var myApp = new App(config);
            this.myLightbox = new LightBox({overlap:true});
            var alertLightbox = new LightBox({overlap:true});
            var addContactView = new AddContactView({collection: this.contactCollection});

            myApp.pipe(this._eventOutput);
            addContactView.pipe(this._eventOutput);
            var cameraView = new CameraView({});

            // create a display context and hook in the App
            var mainDisplay = FamousEngine.createContext();
            mainDisplay.add(cameraView);
            mainDisplay.add(this.myLightbox);
            mainDisplay.add(alertLightbox);
            this.myLightbox.show(myApp);
            FamousEngine.pipe(myApp);

            // start on the main section
            myApp.select(myApp.options.sections[2].title);

            this.outgoingCallView = new OutgoingCallView({collection: this.recentCalls});
            this.incomingCallView = new IncomingCallView({collection: this.recentCalls});
            this.connectedCallView = new ConnectedCallView({collection: this.recentCalls});
            this.outgoingCallView.pipe(this._eventOutput);
            this.incomingCallView.pipe(this._eventOutput);
            this.connectedCallView.pipe(this._eventOutput);
            this.pipe(this.connectedCallView._eventInput);

            // events handling
            this._eventOutput.on('callEnd', onCallEnd);
            this._eventOutput.on('incomingCall', onIncomingCall);
    //        this._eventOutput.on('outgoingCall', onOutgoingCall);
            this._eventOutput.on('connectedCall', onConnectedCall);
            this._eventOutput.on('outGoingCallAccept', onOutGoingCallAccept);
            this._eventOutput.on('editContact', onEditContact);
            this._eventOutput.on('chatContact', _.debounce(onChatContact,300));
            this._eventOutput.on('showApp', onShowApp);
            this._eventOutput.on('submitContact', onSubmitContact);
            this._eventOutput.on('chatOn', onChatOn);
            this._eventOutput.on('chatOff', onChatOff);
            this._eventOutput.on('chatRead', onChatRead);
            this._eventOutput.on('loadRecent', onLoadRecent);
            this._eventOutput.on('updateRecent', onUpdateRecent);
            this._eventOutput.on('clearRecent', onClearRecent);
            this._eventOutput.on('deleteItem', onDeleteItem);
            this._eventOutput.on('deleteFavorite', onDeleteFavorite);
            this._eventOutput.on('toggleFavorite', onToggleFavorite);
            this._eventOutput.on('onEngineClick', onEngineClick);
            this._eventOutput.on('closeAlert', onCloseAlert);
            this._eventOutput.on('editContactDone', onEditContactDone);
            this._eventOutput.on('addContactDone', onAddContactDone);
            this._eventOutput.on('triggerBackToNoneEditing',onTriggerBackToNoneEditing.bind(this));

            this.buttonOnclickRespond();

            function onDeleteFavorite (model) {
                model.toggleFavorite();
            }

            function onToggleFavorite (model) {
                model.toggleFavorite();
            }

            function onDeleteItem (model) {
                model.collection.remove(model);
            }

            function onEditContactDone (formContact){
    //            this.contactCollection.add(formContact);
    //            this.contactCollection.trigger('sync');
            }

            function onAddContactDone (formContact){
    //                this.contactCollection.add(formContact);
    //                this.contactCollection.trigger('sync');
            }

            function onUpdateRecent (e){
                recentsSection.updateItems();
            }

            function onLoadRecent (e){
                recentsSection.setMissedOnly(e.target.outerText);
            }

            function onClearRecent (e){
                recentsSection.clearAll();
            }

            function onShowApp(eventData) {
                var callback;
                if (eventData instanceof Function) {
                    callback = eventData;
                }
                $('.camera').addClass('blur');
                this.myLightbox.show(myApp, true, callback);
            }

            function onOutGoingCallAccept(callee) {
                this.outgoingCallView.accept(callee);
            }

            function onConnectedCall(eventData) {
                var callback;
                var call;
                if (eventData instanceof Function) {
                    callback = eventData;
                } else {
                    call = eventData
                }
                this.connectedCallView.start(this.appSettings, call);
                this.myLightbox.show(this.connectedCallView, true, callback);
                if (call.get('success')) {
                    if (!this.localStream){
                        alert("Please allow camera/microphone access for Beepe");
                    } else {
                        this._eventOutput.emit('chatOn');
                    }
                }
            }
    //
    //        function onOutgoingCall(eventData) {
    //            this.outgoingCallView.start(eventData, this.appSettings);
    //            this.myLightbox.show(this.outgoingCallView, true);
    //        }

            function onIncomingCall(eventData) {
                function onShowNotification() {
                }
                function onCloseNotification() {
                    parent.focus();
                }
                function onClickNotification() {
                    parent.focus();
                }
                if (this.appSettings.get('notification') && !window.colabeoBody) {
                    this.callNotification = new Notify('Incoming Call From', {
                        icon: 'content/ios_icon_x144.png',
                        body: eventData.get('firstname') + ' ' + eventData.get('lastname'),
                        notifyShow: onShowNotification.bind(this),
                        notifyClose: onCloseNotification.bind(this),
                        notifyClick: onClickNotification.bind(this)
                    });
                    this.callNotification.show();
                }

                var curView = this.myLightbox.curRenderable;
                if (curView instanceof IncomingCallView)
                    return;
                if (curView instanceof OutgoingCallView) {
                    this.outgoingCallView.accept(eventData);
                    this._eventOutput.emit('incomingCallAnswer', eventData);
                }
                else {
                    this.incomingCallView.start(eventData);
                    this.myLightbox.show(this.incomingCallView, true);
                }
            }

            function onCallEnd(eventData) {
                this._eventOutput.emit('chatOff');
                // ligntbox shown object stop
                // TODO: hack
                var curView = this.myLightbox.curRenderable;
                if (curView instanceof IncomingCallView){
                    curView.stop();
                } else if (curView instanceof ConnectedCallView) {
                    curView.stop(eventData);
                }
                if (this.phono && this.phono.phone && this.phono.phone.calls)
                    _.chain(this.phono.phone.calls).values().invoke('hangup');
                if (this.chatroom) {
                    var url = '/login?r=' + this.chatroom.uuid;
                    if (this.chatroom.callerName) {
                        url += '&fn=' + this.chatroom.callerName;
                    }
                    window.location = url;
                }
                if (eventData.chat) this._eventOutput.emit('chatRead',eventData.chat);
            }

            function onEditContact(eventData) {
                if (eventData instanceof Contact || eventData instanceof Call) addContactView.setContact(eventData);
                else addContactView.setContact(undefined);
                addContactView.renderContact();
                this.myLightbox.show(addContactView, true);
            }

            function onChatContact(eventData) {
                function chatByContact(contact) {
                    contact = new Contact(contact.omit('success'));
                    this._eventOutput.emit('connectedCall', contact);
                }
                if (eventData instanceof Contact || eventData instanceof Call) {
                    if (eventData.get('cid')) {
                        chatByContact.bind(this)(eventData);
                    } else {
                        this.lookup(eventData, chatByContact.bind(this), this.onUserNotFound.bind(this));
                    }
                }
            }

            function onChatOn() {
                cameraView.turnOn();
            }

            function onChatOff() {
                cameraView.turnOff();
            }

            function onChatRead(contact) {
                var chat = _(chatsSection.collection.models).find(function(chat) {
                    return chat.get('cid')==contact.get('cid');
                });
                if (chat) {
                    chat.set({
                        read: true
                    });
                }
            }

            function onSubmitContact(contact) {
                if (!contact.get('dcr')) {
                    this.lookup(contact, null, function(contact, query) {
                        this.setupChatroom(contact, query);
                    }.bind(this));
                }
            }

            FamousEngine.on('click', onEngineClick.bind(this));
            function onEngineClick(e) {
                switch (e.target.id)
                {
                    case 'clear-button':
                        this._eventOutput.emit('clearRecent');
                        break;
                    case 'add-contact':
                        this._eventOutput.emit('editContact');
                        break;
                    case 'chats-edit-contact':
                        $('body').toggleClass('editing');
                        this._eventInput.emit('toggleAllChat');
                        break;
                    case 'recent-edit-contact':
                        $('body').toggleClass('editing');
                        this._eventInput.emit('toggleAllRecent');
                        break;
                    case 'favorite-edit-contact':
                        $('body').toggleClass('editing');
                        this._eventInput.emit('toggleAllFavorite');
                        break;
                    case 'contact-edit-contact':
                        $('body').toggleClass('editing');
                        this._eventInput.emit('toggleAllContact');
                        break;
                    case 'recent-toggle':
                        this._eventOutput.emit('loadRecent', e);
                        break;
                    case 'close-alert':
                        this._eventOutput.emit('closeAlert');
                }

                if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') {
                    $(e.target).focus();
                    this._input = e.target;
                } else if (e.target.className == 'send-text-button') {
                    $(this._input).focus();
                } else {
                    if (this._input) {
                        $(this._input).blur();
                        this._input = null;
                    }
                }
            }

            // fastclick hack
    //        $('body').on('click', 'input', function(e) {
    //            $(e.target).focus();
    //        }.bind(this));

            function onTriggerBackToNoneEditing(e) {
                this._eventInput.emit('backToNoneEditing');
            }

            function onAlert(word, okHidden){
                var alertView = new AlertView(word, okHidden);
                alertLightbox.show(alertView,true);
            }

            function onCloseAlert(){
                alertLightbox.hide();
            }

            window.alert = onAlert;
            if (this.chatroom) alert('Please allow Beepe to use your camera/microphone for phone calls.', true);

            this.init();

    //        if (Helpers.isDev()){
    //            window.colabeo = this;
    //            colabeo.chatsSection = chatsSection;
    //            colabeo.recentsSection = recentsSection;
    //            colabeo.contactsSection = contactsSection;
    //            colabeo.dialSection = dialSection;
    //            colabeo.favoritesSection = favoritesSection;
    //            colabeo.cameraView = cameraView;
    //            colabeo.addContactView = addContactView;
    //            colabeo.app = myApp;
    //            colabeo.engine = FamousEngine;
    //            colabeo.social = {};
    //        }

    //        window._cola_g = {};
    //        _cola_g.cid = this.appSettings.get('cid');


        }.bind(this));
    }

    MainController.prototype.init = function() {
        this.phono = $.phono({
            apiKey: "233f5673a7329a4cb7a5a2d0e5b6696e9ec245f8f7410e0631f4938c4395ca3163db86f7a9eda9d42633a308",
            onReady: function() {

            }
        });

        this.iceServerConfig = defaultIceConfig;
        // get Xirsys ice config
        this.getXirsys();
        this.disableNow = false;
        var userId = this.appSettings.get('cid');
        var userFullName = this.appSettings.get('firstname') + " " + this.appSettings.get('lastname');
        this.listenRef = new Firebase(this.appSettings.get('firebaseUrl') + 'calls/' + userId);
        // remove zombie call after disconnect
        this.listenRef.onDisconnect().remove();

        if (Helpers.isMobile()) {
            window._disableResize = true;
            $('body').addClass('mobile');
            if (this.appSettings.get('blur') == undefined)
                this.appSettings.set('blur', false);
        } else {
            if (this.appSettings.get('blur') == undefined)
                this.appSettings.set('blur', true);
        }
        this.setupCallListener();
        this.setupVideo();
        this.setupSettingsListener();

        this.loadConnected(function(data){
            if (!data || !Array.isArray(data)) return;
            var linkAccounts = {};
            data.map(function(item){
                linkAccounts[item.provider] = true;
            });
            this.appSettings.save({
                linkAccounts: linkAccounts
            });
        }.bind(this));

        // TODO: hack for android chrome DATAconnection
        util.supports.sctp = false;
        sendMessage("event", {data: {action:"syncID", id: userId, name: userFullName}});

    //        window.addEventListener("message", onMessage.bind(this), false);
        if (window.colabeoBody)
            window.colabeoBody.addEventListener("FromExtension", onExtensionMessage.bind(this));
    //        setTimeout(function(){this.eventOutput.emit('incomingChat')}.bind(this),3000);
    };

    MainController.prototype.setupSettingsListener = function() {
        this._eventOutput.on('outgoingChat', function(evt) {
            this.outgoingChat(evt.content, evt.type);
        }.bind(this));
        this._eventOutput.on('sendChat', this.sendChat.bind(this));
        this._eventOutput.on('setCamera', function() {
            this.setCamera();
        }.bind(this));
        this._eventOutput.on('setVideo', function() {
            this.setVideo();
        }.bind(this));
        this._eventOutput.on('setBlur', function() {
            this.setBlur();
        }.bind(this));
        this._eventOutput.on('setAudio', function() {
            this.setAudio();
        }.bind(this));
        this._eventOutput.on('onSocialLink', function(source) {
            var url;
            if (source == 'facebook') {
                url = "/connect/facebook/email";
            }
            else if (source == 'google') {
                url = "/connect/google/profile%20email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.login%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me";
            }
            else {
                url = '/connect/' + source;
            }


            if (url) {
    //                if (Helpers.isMobile()) {
    //                    window.location = url;
    //                } else {
                $.oauthpopup({
                    path:url,
                    callback: function(e) {
                        setTimeout(function() {
                            $('div.import-contact#'+source + ':not(.done)').click().addClass('done');
                        }.bind(this), 300);
                    }
                });
    //                }
            }

        })
        $('body').on('change', '#audio, #video', function(e){
            this.appSettings.set($(e.target)[0].id, $(e.target).prop('checked'));
        }.bind(this));
    };
    MainController.prototype.callByPhono = function(contact) {
        var number = contact.get('phone');
        this.outgoingCallView.stopCalltone();
        this.outgoingCallView.setPhoneOnly();
        if (Helpers.isMobile()) {
            window.open("tel:"+number);
        } else {
            var nFriendsRequired = 5;
            var friendsCount = this.contactCollection.filter(function(m){return m.get('cid')}).length;
            if ( friendsCount < nFriendsRequired) {
                alert("To unlock phone number calling feature, please invite " + nFriendsRequired + " friends to join Beepe.<br>Current Beepe Friends: " + friendsCount);
                return;
            }
            if (!this.localStream){
                alert("Please allow camera/microphone access for Beepe");
                return;
            }
            this.phono.phone.dial("app:9990036398", {
                headers: [
                    {
                        name:"x-numbertodial",
                        value: number
                    }
                ],
                onRing: function() {
                    console.log("*******Ringing");
                }.bind(this),
                onAnswer: function() {
                    console.log("*******Answered");
                    contact = new Contact(contact.omit('success'));
                    contact.set({
                        success: true
                    });
                    this._eventOutput.emit('outGoingCallAccept', contact);
                    this._eventOutput.emit('connectedCall', contact);
                }.bind(this),
                onHangup: function() {
                    console.log("*******Hungup");
                    this._eventOutput.emit('callEnd', {exit: true});
                }.bind(this)
            });
        }
    };

    MainController.prototype.setupCallListener = function() {
        this.listenRef.on('child_added', onAdd.bind(this));
        this.listenRef.on('child_changed', onChanged.bind(this));
        this.listenRef.on('child_removed', onRemove.bind(this));
        this._eventOutput.on('outgoingCallEnd', onOutgoingCallEnd.bind(this));
        this._eventOutput.on('incomingCallEnd', onIncomingCallEnd.bind(this));
        this._eventOutput.on('incomingCallAnswer', onIncomingCallAnswer.bind(this));
        this._eventOutput.on('outgoingCall', onOutgoingCall.bind(this));
        this._eventOutput.on('outgoingPhoneCall', onOutgoingPhoneCall.bind(this));
        this._eventOutput.on('sync', onSync.bind(this));
        function onAdd(snapshot) {
            var f = snapshot.val().firstname || snapshot.val().person.split(' ')[0];
            var l = snapshot.val().lastname || snapshot.val().person.split(' ')[1];
            var e = snapshot.val().email;
            var p = snapshot.val().pictureUrl || false;
            var c = snapshot.val()['name'] == 'unknown' ? "" : snapshot.val()['name'];
            var r = snapshot.name();
            var call = new Call({
                firstname: f,
                lastname: l,
                email: e,
                pictureUrl: p,
                roomId: r,
                caller: c
            });
            this._eventOutput.emit('incomingCall', call);
        }
        function onChanged(snapshot){
            // this solves multiple beepe incoming call problem
            var refCallState = snapshot.val()['state'];
            if (refCallState == "answered") {
                var curView = this.myLightbox.curRenderable;
                if (curView instanceof IncomingCallView)
                    curView.stop();
            }
        }
        function onRemove(snapshot){
            this._eventOutput.emit('callEnd', {exit: false});
            this.exitRoom();
        }
        function onOutgoingCallEnd(call) {
            if (this.callRef) this.callRef.remove();
            this.exitRoom();
            if (this.phono && this.phono.phone && this.phono.phone.calls)
                _.chain(this.phono.phone.calls).values().invoke('hangup');
        }
        function onIncomingCallEnd(call) {
            if (this.listenRef) this.listenRef.remove();
            this.exitRoom();
            if (this.callNotification && this.callNotification.myNotify)
                this.callNotification.myNotify.close();
        }
        function onIncomingCallAnswer(call) {
            if (call instanceof Call) {
                var caller = call.get('caller');
                var callee = this.appSettings.get('cid');
                var roomId = call.get('roomId');
                if (roomId) {
                    this.listenRef.child(roomId).update({
                        state : "answered"
                    });
                    this.joinRoom(caller, callee, roomId);
                }
            }
            if (this.callNotification && this.callNotification.myNotify)
                this.callNotification.myNotify.close();
        }
        function onOutgoingPhoneCall(contact) {
            if (this.callRef) this.callRef.remove();
            this.callByPhono(contact);
        }
        function onOutgoingCall(contact) {
            this.outgoingCallView.start(contact, this.appSettings);
            this.myLightbox.show(this.outgoingCallView, true);
            if (contact.get('cid') && contact.get('cid')!= 'testcid') {
                callByContact.bind(this)(contact);
            }
            else if (!isNaN(contact.get('phone'))) {
                this.lookup(contact, callByContact.bind(this),this.callByPhono.bind(this));
            }
            else {
                this.lookup(contact, callByContact.bind(this), this.onUserNotFound.bind(this));
            }

            function callByContact(contact) {
                if (!this.localStream){
                    alert("Please allow camera/microphone access for Beepe");
                    return;
                }
                var id = contact.get('cid');
                var provider = contact.get('provider');
                if (!id) return;
                var recentsRef = new Firebase(this.appSettings.get('firebaseUrl') + 'history/' + id +'/calls');
                var newCall = {
                    firstname: this.appSettings.get('firstname'),
                    lastname: this.appSettings.get('lastname'),
                    email: this.appSettings.get('email'),
                    pictureUrl: false,
                    type: 'incoming',
                    time: Firebase.ServerValue.TIMESTAMP,
                    cid: this.appSettings.get('cid')
                };
                recentsRef.push(newCall);
                // TODO: delete hack
                //    delete recentsRef;
                this.callRef = new Firebase(this.appSettings.get('firebaseUrl') + 'calls/' + id);
                // remove zombie call after disconnect
                this.callRef.onDisconnect().remove();

                var callerFullName = this.appSettings.get('firstname') + " " + this.appSettings.get('lastname');
                var callObj = {
                    name : this.appSettings.get('cid'),
                    person : callerFullName,
                    firstname : this.appSettings.get('firstname'),
                    lastname : this.appSettings.get('lastname'),
                    state : "calling"
                };
                if (this.appSettings.get('email')) callObj.email = this.appSettings.get('email');
                if (this.appSettings.get('username')) callObj.username = this.appSettings.get('username');
                this.callRef.once("value", function(snapshot) {
                    if(snapshot.val() == null) {
                        this.callRef.push(callObj);
                        this.callRef.once('child_changed', onChanged.bind(this));
                        this.callRef.once('child_removed', onRemove.bind(this));
                    } else {
                        // TODO: delete hack
    //            delete this.callRef;
                    }
                }.bind(this));

                function onChanged(snapshot){
                    var refCallState = snapshot.val()['state'];
                    if (refCallState == "answered") {
                        var caller = this.appSettings.get('cid');
                        var callee = id;
                        var roomId = snapshot.name();
                        this.startRoom(caller, callee, roomId);
                        this._eventOutput.emit('outGoingCallAccept', callee);
                    }
                }
                function onRemove(snapshot){
                    this._eventOutput.emit('callEnd', {exit: false});
                    this.exitRoom();
                }
            };
        }
        function onSync() {
            this.onSyncButton();
        }
    };

    /* start of peer call */
    MainController.prototype.setupVideo = function() {
        // Compatibility shim
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    //        this.startRoom();
        if (navigator.getUserMedia) this.setCamera();
    };

    MainController.prototype.initLocalMedia = function(options) {
        var options = _.extend({audio: true, video: true},options);
        // Get audio/video stream
        navigator.getUserMedia(options,
            function(stream){
                // Set your video displays
                $('.local-video video').prop('src', URL.createObjectURL(stream));
                this.localStream = stream;
                this.cleanRoom();
                this.setBlur();
                this.setAudio();
                if (options.video) $('.camera').removeClass('off');
                else $('.camera').addClass('off');

                this._eventOutput.emit('closeAlert');

                if (this.chatroom) {
                    var call = new Call({
                        firstname: this.chatroom.callerFirstName || this.chatroom.callerName || "",
                        lastname: this.chatroom.callerLastName || "",
                        email: this.chatroom.callerAccountId || "",
                        cid: this.chatroom.caller || "",
                        provider: this.chatroom.calleeAccountProvider || ""
                    });
                    this._eventOutput.emit('outgoingCall', call);
                }
            }.bind(this),
            function(){
    //                alert("Please allow camera access for Beepe");
                $('.camera').addClass('off');
            }.bind(this)
        );
    };

    MainController.prototype.initRemoteMedia = function(call) {
        // Hang up on an existing call if present
        if (this.existingCall) {
            this.existingCall.close();
        }

        // Wait for stream on the call, then set peer video display
        call.on('stream', function(stream){
            $('.remote-video video').prop('src', URL.createObjectURL(stream));
        }.bind(this));

        // UI stuff
        this.existingCall = call;
        call.on('close', this.cleanRoom.bind(this));
    };

    MainController.prototype.startRoom = function(caller, callee, roomId)  {
        if (roomId) roomId = "A"+roomId+"Z";
        // PeerJS object
        this.peer = new Peer(roomId, {
    //            debug: 0,
            host: this.appSettings.get('pHost'),
            port: this.appSettings.get('pPort'),
            secure: this.appSettings.get('pSecure'),
            config: this.iceServerConfig
        });
        this.peer.on('open', function(){
        }.bind(this));

        // Receiving a call
        this.peer.on('call', function(call){
            call.answer(this.localStream);
            this.initRemoteMedia(call);
            sendMessage("event", {data: {action:"setProperty", roomId: roomId}});
        }.bind(this));

        // Receiving data
        this.peer.on('connection', function(conn){
            this.setupPeerConn(conn);
        }.bind(this));

        this.peer.on('error', function(err){
        }.bind(this));
    };

    MainController.prototype.joinRoom = function(caller, callee, roomId) {
        if (roomId) roomId = "A"+roomId+"Z";
        // PeerJS object
        this.peer = new Peer({
            host: this.appSettings.get('pHost'),
            port: this.appSettings.get('pPort'),
            secure: this.appSettings.get('pSecure'),
            config: this.iceServerConfig
        });
        setTimeout(function(){
            // Initiate a call!
            var call = this.peer.call(roomId, this.localStream);
            this.initRemoteMedia(call);
            sendMessage("event", {data: {action:"setProperty", roomId: roomId}});

            var conn = this.peer.connect(roomId, {
                label: 'chat',
                reliable: false
            });
            this.setupPeerConn(conn);
        }.bind(this),1000);
    };

    MainController.prototype.getXirsys = function(callback) {
        $.post("https://api.xirsys.com/getIceServers",
            {
                domain: "dashboard.colabeo.com",
                room: "default",
                application: "default",
                ident: "chapman",
                secret: "02f0e22c-764e-4939-8042-4ea028e9b8e0",
                secure: 0
            }, function(data,status){
                if (data) {
                    var xirsys = JSON.parse(data);
                    var iceServerXIR = xirsys.d;
                    if (iceServerXIR) {
                        this.iceServerConfig = {
                            'iceServers': defaultIceConfig.iceServers.concat(iceServerXIR.iceServers)
                        };
                    }
                }
                if (callback) callback(iceServer);
            }.bind(this)
        );
    };

    MainController.prototype.setupPeerConn = function(conn) {
        this.conn = conn;
        this.conn.on('open', function() {
            // Receive messages
            this.conn.on('data', onMessage.bind(this));
        }.bind(this));
    }

    MainController.prototype.exitRoom = function() {
        if (this.existingCall) {
            this.existingCall.close();
        }
        sendMessage("event", {data: {action:"setProperty", roomId: null}});
        sendMessage("event", {data: {action:"endCall"}});
        this.cleanRoom();
    };

    MainController.prototype.cleanRoom = function() {
        if (this.peer) this.peer.destroy();
        if (this.conn) this.conn.close();
    };

    /* end of peer call */

    MainController.prototype.setCamera = function() {
        this.initLocalMedia({video: this.appSettings.get('camera'), audio: true});
    };

    MainController.prototype.setBlur = function() {
        var on = this.appSettings.get('blur');
        if (on)
            $('.camera').removeClass('fakeblur');
        else
            $('.camera').addClass('fakeblur');
    };

    MainController.prototype.setAudio = function() {
        var audio = this.appSettings.get('audio');
        if (this.localStream) {
            var audioTracks = this.localStream.getAudioTracks();
            for (var i = 0, l = audioTracks.length; i < l; i++) {
                audioTracks[i].enabled = audio;
            }
        }
    };

    MainController.prototype.setVideo = function() {
        var video = this.appSettings.get('video');
        var camera = this.appSettings.get('camera');
        if (this.localStream && camera) {
            var videoTracks = this.localStream.getVideoTracks();
            for (var i = 0, l = videoTracks.length; i < l; i++) {
                videoTracks[i].enabled = video;
            }
            if (video)
                $('.camera').removeClass('off');
            else
                $('.camera').addClass('off');
        }
    };

    MainController.prototype.lookup = function(data, callback, onFailure) {
        var query = [];
        // TODO: add more providers here in the future
        ['email', 'phone', 'facebook', 'google', 'twitter', 'linkedin', 'github', 'yammer'].map(function(provider){
            if (data.get(provider)) {
                query.push({provider: provider, eid: data.get(provider).id || data.get(provider)});
            }
        });
        if (query.length) {
            multipleLookup(query, function(result) {
                if (result.length) {
                    var callee = _.last(result);
                    var cid;
                    if (callee.user && callee.user.objectId) cid = callee.user.objectId;
                    else if (callee.objectId) cid = callee.objectId;
                    // This might not be good if the user's cid changes in the future
                    console.log(data);
                    data.set({cid: cid});
                    if (callback) callback(data);
                    if (!data.get('dcr')) {
                        this.setupChatroom(data, query);
                    }
                }
                else {
                    if (onFailure) onFailure(data, query);
                }
            }.bind(this));
        } else {
            alert('This contact is empty.');
        }
    };

    MainController.prototype.sendChat = function(chat) {
        var message = chat.message;
        var id = chat.contact.get('cid');
        if (!id) return;
        var userId = this.appSettings.get('cid');
        var toRef = new Firebase(this.appSettings.get('firebaseUrl') + 'chats/' + id + '/' + userId);
        var fromRef = new Firebase(this.appSettings.get('firebaseUrl') + 'chats/' + userId + '/' + id);
        var chatObj = {
            content: message,
            type: 'text',
            from: userId,
            time: Firebase.ServerValue.TIMESTAMP
        }
        toRef.push(chatObj);
        fromRef.push(chatObj);
        var recentsRef = new Firebase(this.appSettings.get('firebaseUrl') + 'history/' + id +'/chats/' + userId);
        var newChat = {
            firstname: this.appSettings.get('firstname')||'',
            lastname: this.appSettings.get('lastname')||'',
            email: this.appSettings.get('email')||'',
            pictureUrl: false,
            time: Firebase.ServerValue.TIMESTAMP,
            cid: this.appSettings.get('cid'),
            content: message,
            type: 'text',
            read: false
        };
        recentsRef.set(newChat);
        var chatsRef = new Firebase(this.appSettings.get('firebaseUrl') + 'history/' + userId +'/chats/' + id);
        var newChat = {
            firstname: chat.contact.get('firstname')||'',
            lastname: chat.contact.get('lastname')||'',
            email: chat.contact.get('email')||'',
            pictureUrl: false,
            time: Firebase.ServerValue.TIMESTAMP,
            cid: id,
            content: message,
            type: 'text',
            read: true
        };
        chatsRef.set(newChat);
    }

    MainController.prototype.loadUser = function(done) {
        if (location.pathname == '/call' || location.pathname.match('/dcr/')) {
            var params = parseQueryString();
            var room = params['r'] ? params['r'][0] : location.pathname.split('/')[2]
            if (room) {
                $.ajax({
                    url: '/chatroom?id='+room,
                    type: 'get',
                    dataType: 'json',
                    success: function(data) {
                        if (done) done({chatroom: data});
                    },
                    error: function() {
                        console.log('error');
                        // TODO: temp dev user
                        if (done) done({});
                    }
                });
            }
        } else {
            $.ajax({
                url: '/me',
                type: 'get',
                dataType: 'json',
                success: function(data) {
                    if (done) done(data);
                },
                error: function() {
                    console.log('error');
                    // TODO: temp dev user
                    if (done) done({});
                }
            });
        }
        function parseQueryString() {
            var query = (window.location.search || '?').substr(1),
                map   = {};
            query.replace(/([^&=]+)=?([^&]*)(?:&+|$)/g, function(match, key, value) {
                (map[key] = map[key] || []).push(value);
            });
            return map;
        }
    };

    MainController.prototype.loadConnected = function(done) {
        $.ajax({
            url: '/connected',
            type: 'get',
            dataType: 'json',
            success: function(data) {
                if (done) done(data);
            },
            error: function() {
                console.log('error');
                // TODO: temp dev user
                if (done) done({});
            }
        });
    };

    MainController.prototype.loadContact = function(source, done) {
        $.ajax({
            url: '/contact/' + source,
            type: 'get',
            dataType: 'json',
            success: function(data) {
                if (done) done.bind(this)(data);
            },
            error: function() {
                console.log('error');
                // TODO: temp dev user
                if (done) done.bind(this)({});
            }
        });
    };

    MainController.prototype.saveContact = function(data) {
        _.each(data, function(item) {
            var contact = {};
            if (!item.firstname) {
                var names = item.name.split(' ');
                item.lastname = names.pop();
                item.firstname = names.join(' ');
            }
            contact.firstname = item.firstname;
            contact.lastname = item.lastname;
            if (item.provider) contact[item.provider] = item;
            if (!this.contactCollection.find(
                function(model) {
                    return model.get(item.provider) && model.get(item.provider).id == item.id;
                }
            )) {
                this.contactCollection.create(contact);
            }
        }.bind(this));
        this.contactCollection.trigger('sync');
        if (data.length) {
            localStorage.setItem('preloadfb'+this.appSettings.get('cid'), true);
        }
    };

    MainController.prototype.setupChatroom = function(contact, eids, callback) {
        for (var i = 0; i < eids.length; i++) {
            var c = eids[i];
            if (c) {
                var callee = {
                    provider : c.provider ,
                    eid : c.eid ,
                    name: contact.get('firstname') + " " + contact.get('lastname'),
                    firstname: contact.get('firstname'),
                    lastname: contact.get('lastname'),
                    email: contact.get('email')
                };
                $.ajax({
                    url: '/chatroom',
                    type: 'post',
                    data: {
                        callee : JSON.stringify(callee),
                        // 0: do nothing 1: chatroom invite 2: missed call
                        e: 1,
                        d: 0
                    },
                    success: function(data) {
                        contact.set({dcr: data.chatid});
                        if (callback) callback(contact);
                    },
                    error: function() {

                    }
                });
            }
        }
    };

    MainController.prototype.onSyncButton = function() {
        sendMessage("event", {data: {action:"sync"}});
    };

    MainController.prototype.outgoingChat = function(message, type) {
        if (!type) type = "text";
        if (this.conn) this.conn.send({content:message, type: type, action:"chat"});
    };

    function userLookup(externalId, provider, done) {
        $.ajax({
            url: '/finduser',
            type: 'get',
            dataType: 'json',
            data: { provider: provider, externalId : externalId },
            success: function(data) {
                done(data);
            },
            error: function() {
                console.log('error');
                // TODO: show default call for now
                done(new Call());
            }
        });
    }
    function multipleLookup(query, done) {
        query = JSON.stringify(query);
        $.ajax({
            url: '/findusers',
            type: 'get',
            dataType: 'json',
            data: { query: query },
            success: function(data) {
                done(data);
            },
            error: function() {
                console.log('error');
                // TODO: show default call for now
                done(new Call());
            }
        });
    }
    function sendMessage(type, data) {
        if (Helpers.isMobile()) return;
        if (!window.colabeoBody)
            return;
        var evt = new CustomEvent("FromKoala", {
            detail : {
                type : type,
                data : data
            }
        });
        window.colabeoBody.dispatchEvent(evt);
    }
    function updateSync() {
        if (this.remoteUrl==this.localUrl)
            $('.sync-button').removeClass('syncing').addClass('synced');
        else
            $('.sync-button').removeClass('synced syncing');
    }
    function onExtensionMessage(e) {
        if (e.detail.action == "updateUrl") {
            if (e.detail.source== "remote")
                this.remoteUrl = e.detail.url;
            else
                this.localUrl = e.detail.url;
            updateSync.bind(this)();
        }
        if (this.disableNow) return;
        if (e.detail.action == "incoming")	{
            var call = new Call({
                firstname: e.detail.firstname,
                lastname: e.detail.lastname,
                email: e.detail.email,
                pictureUrl: null,
                roomId: e.detail.room
            });
            this._eventOutput.emit('incomingCall', call);
        }
        else if (this.conn) {
            // peer message forward
            this.conn.send(e.detail);
        }
    }
    function onMessage(e) {
        this.disableNow = true;
        setTimeout(function(){
            this.disableNow = false;
        }.bind(this),1000);
        var evt = e;
        if (evt.action=="chat") {
            this._eventOutput.emit('incomingChat', evt);
        } else {
            if (Helpers.isMobile() && evt.data && evt.data.url && evt.data.action == "urlChange") {
                window.open(evt.data.url);
            }
            sendMessage("event", evt);
        }
    }

    MainController.prototype.buttonOnclickRespond = function(){
        this.activedButton=undefined;
        this.activedClassList='.touchable';
        $(document).on('mousedown touchstart', this.activedClassList, function(e){
            this.activedButton=$(e.currentTarget);
            this.activedButton.addClass('touchable-active');
        }.bind(this));
        $(document).on('mouseout', this.activedClassList, function(e){
            if (this.activedButton) {
                this.activedButton.removeClass('touchable-active');
                this.activedButton.one('mouseover', function(ee){
                    this.activedButton.addClass('touchable-active');
                }.bind(this));
            }
        }.bind(this));
        $(document).on('mouseup touchend', function(e){
            if (this.activedButton) {
                setTimeout(function(){
                    this.activedButton.removeClass('touchable-active');
                    this.activedButton.off();
                    this.activedButton=undefined;
                }.bind(this),200);
            }
        }.bind(this));
    };

    MainController.prototype.onUserNotFound = function(contact, query){
        alert('The user you are reaching is not a Beepe user. Please send an invite.');
        if (contact.get('dcr')) {
            this._eventOutput.emit('editContact', contact);
        } else {
            this.setupChatroom(contact, query, function() {
                this._eventOutput.emit('editContact', contact);
            }.bind(this));
        }
        this.outgoingCallView.stopCalltone();
    };

    module.exports = MainController;
});