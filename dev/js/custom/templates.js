var Helpers        = require('helpers');
var Utility        = require('famous/utilities/utility');

module.exports = {
    toggleSwitch: function(id, checked, disabled) {
        var html = [
            '<div class="onoffswitch">',
            '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="',
            id,
            '" '
        ];
        if (checked) html.push('checked ');
        if (disabled) html.push('disabled ');
        html.push('><label class="onoffswitch-label');
        if (disabled) html.push(' disabled');
        html = html.concat([
            '" for="',
            id,
            '">',
            '<div class="onoffswitch-inner"></div>',
            '<div class="onoffswitch-switch"></div>',
            '</label>',
            '</div>'
        ]);
        return html.join('');
    },

    toggleButton: function(options) {
        if (!options.id) options.id = "toggleButton" + Math.floor(100000*Math.random());
        if (!options.classes) options.classes = [];
        var html = [
            '<div class="onoffbutton ' + options.classes.join(" ") + '">',
            '<input type="checkbox" name="onoffbutton" class="onoffbutton-checkbox"'
        ];
        if (options.id) html.push(' id="'+options.id+'" ');
        if (options.checked) html.push('checked');
        html.push('><label class="onoffbutton-label" for="'+options.id+'"');
        if (options.size) {
            html = html.concat([
                'style="width:'+options.size[0]+'px;',
                'line-height:'+options.size[1]+'px;"'
            ]);
        }
        html.push('><div class="onoffbutton-on"');
        if (options.onBackgroundColor) {
            html.push('style="background-color:'+options.onBackgroundColor+';"');
        }
        html.push('>'+options.onContent+'</div>');
        html.push('<div class="onoffbutton-off"');
        if (options.offBackgroundColor) {
            html.push('style="background-color:'+options.offBackgroundColor+';"');
        }
        html = html.concat([
            '>'+options.offContent+'</div>',
            '</label>',
            '</div>'
        ]);
        return html.join('');
    },

    deleteButton: function() {
        return '<button class="delete-button fa fa-trash-o fa-lg"></button>';
    },

    addButton: function(id) {
        return '<i class="fa fa-plus add-button" id="' + id + '"></i>';
    },

    plusButton: function(id) {
        return [
            '<span class="fa-stack fa-lg delete-button2" id="',
            id ,
            '"><i class="fa fa-circle fa-stack"></i>',
            '<i class="fa fa-plus fa-stack"></i>',
            '</span>'
        ].join('');
    },

    phoneButton: function(id) {
        return [
            '<span class="fa-stack fa-lg phone-button touchable" id="',
            id ,
            '"><i class="fa fa-square fa-stack-2x fa-background"></i>',
            '<i class="fa fa-phone fa-stack-1x fa-frontground"></i>',
            '</span>'
        ].join('');
    },
    removeButton: function (id) {
        return '<i class="fa fa-times remove-button" id="' + id + '"></i>';
    },

    editButton: function (id) {
        return [
            '<span class="fa-stack edit-button2" id="',
            id ,
            '"><i class="fa fa-circle-o fa-stack-2x fa-background"></i>',
            '<i class="fa fa-info fa-stack-1x fa-frontground"></i>',
            '</span>'
        ].join('');
    },

    crossButton: function(id) {
        return [
            '<span class="fa-stack delete-button2" id="',
            id ,
            '"><i class="fa fa-circle-o fa-stack-2x fa-background"></i>',
            '<i class="fa fa-times fa-stack-1x fa-frontground"></i>',
            '</span>'
        ].join('');
    },

    favoriteButton2: function(ative,id) {
        var html = [
            '<span class="fa-stack favorite-button2" id="',
            id ,
            '"><i class="fa fa-circle fa-stack-2x fa-background"></i>',
            '<i class="fa fa-star fa-stack-1x fa-frontground'];
            if (ative) html.push(' active');
            html.push('"></i></span>');
        return html.join('');
    },

    nextButton: function(id) {
        return '<i class="arrow fa fa-angle-right fa-lg import-contact" id="' + id + '"></i>';
    },

    favoriteButton: function(active) {
        var html = ['<i class="favorite-button fa fa-star fa-2x'];
        if (active) html.push(' active');
        html.push('"></i>');
        return html.join('');
    },

    button: function(options) {
        if (!options.id) options.id = "button" + Math.floor(100000*Math.random());
        if (!options.classes) options.classes = [];
        var html = ['<button class="button ' + options.classes.join(" ") + '" style="'];
        if (options.size) {
            html = html.concat([
                'width:'+options.size[0]+'px;',
                'height:'+options.size[1]+'px;',
                'line-height:'+options.size[1]+'px;'
            ]);
        }
        html.push('">'+options.content+'</button>');
        return html.join('');
    },

    itemFrame: function(marginLeft, marginRight){
        var realWidth = window.innerWidth - marginLeft - marginRight;

        return [
            '<div class="item-frame" style="width: ',
            realWidth,
            'px; margin-left: ',
            marginLeft,
            'px; margin-right: ',
            marginRight,
            'px"></div>'
        ].join('');
    },

    itemFrame2: function(leftButtons, rightButton, marginLeft, marginRight){
        var realWidth = window.innerWidth - marginLeft - marginRight;
        var contentLeftButtons = (leftButtons)? (_(leftButtons).map(function(left){return left.content})).join(''):'';
        var contentRightButton = (rightButton)? rightButton.content:'';

        return [
            '<div class="item-frame item-view-2S" style="width: ',
            realWidth,
            'px; margin-left: ',
            marginLeft,
            'px; margin-right: ',
            marginRight,
            'px">',
            contentLeftButtons,contentRightButton,
            '</div>'
        ].join('');
    },



    recentItemView: function(call) {
        var name;
        if (call.get('firstname') || call.get('lastname')) {
            name = call.get('firstname') + " <b>" + call.get('lastname') + "</b>";
        } else if (call.get('email')){
            name = call.get('email');
        } else {
            name = call.get('phone');
        }
        var icon = '';
        var missed = '';
        if (call.get('type') == 'outgoing')
            icon = '<i class="fa fa-sign-out"></i>';
        else {
            if (!call.get('success'))
                missed = "missed";
        }

        return [
            '<div style = " width: ',
            window.innerWidth,
            'px"><div class="source ',
            missed,
            '"><div class="call-type">',
            icon,
            '</div>',
            name,
            '<div class="call-time">',
            Helpers.timeSince(call.get('time')),
            '</div></div></div>'
        ].join('');
    },

    chatItemView: function(contact) {
        var name;
        var initial = "";
        if (contact.get('firstname') || contact.get('lastname')) {
            name = contact.get('firstname') + " <b>" + contact.get('lastname') + "</b>";
            if (contact.get('firstname')) initial = contact.get('firstname')[0];
            if (contact.get('lastname')) initial +=  contact.get('lastname')[0];
        } else if (contact.get('email')){
            name = contact.get('email');
            if (name) initial = name[0];
        } else {
            name = contact.get('phone');
            if (name) initial = name[0];
        }
        return [
            '<div style = " width: ',
            window.innerWidth,
            'px"><div class="source"><div class="initial ',
            contact.get('read') ? '':'unread',
            '">',
            initial,
            '</div>',
            name,
            '<div class="call-time">',
            Helpers.timeSince(contact.get('time')),
            '</div>',
            '<div class="message">',
            contact.get('content'),
            '</div></div>'
        ].join('');
    },

    contactItemView: function(model) {
        var name;
        if (model.get('firstname') || model.get('lastname')) {
            name = [model.get('firstname'), ' <b>',  model.get('lastname') , '</b>'].join('');
        } else if (model.get('email')){
            name = model.get('email');
        } else {
            name = model.get('phone');
        }
        var contact = ['<div style = " width: ',
            window.innerWidth,
            'px"><div class="source">',
            name].join('');
        if (model.attributes.phone) contact = [contact , '<i class="fa fa-phone contact-icon"></i>'].join('');
        if (model.attributes.email) contact = [contact , '<i class="fa fa-envelope contact-icon"></i>'].join('');
        if (model.attributes.facebook) contact = [contact , '<i class="fa fa-facebook-square contact-icon"></i>'].join('');
        if (model.attributes.google) contact = [contact , '<i class="fa fa-google-plus-square contact-icon"></i>'].join('');
        if (model.attributes.twitter) contact = [contact , '<i class="fa fa-twitter-square contact-icon"></i>'].join('');
        if (model.attributes.github) contact = [contact , '<i class="fa fa-github-square contact-icon"></i>'].join('');
        if (model.attributes.linkedin) contact = [contact , '<i class="fa fa-linkedin-square contact-icon"></i>'].join('');
        if (model.attributes.yammer) contact = [contact , '<i class="fa fa-yammer-todo contact-icon"></i>'].join('');
        contact = [contact, '</div></div>'].join('');
        return contact;
    },

    favoriteItemView: function(contact) {
        var name;
        var initial = "";
        if (contact.get('firstname') || contact.get('lastname')) {
            name = contact.get('firstname') + " <b>" + contact.get('lastname') + "</b>";
            if (contact.get('firstname')) initial = contact.get('firstname')[0];
            if (contact.get('lastname')) initial +=  contact.get('lastname')[0];
        } else if (contact.get('email')){
            name = contact.get('email');
            if (name) initial = name[0];
        } else {
            name = contact.get('phone');
            if (name) initial = name[0];
        }

        return [
            '<div style = " width: ',
            window.innerWidth,
            'px"><div class="source"><div class="initial">',
            initial,
            '</div>',
            name,
            '</div></div>'
        ].join('');
    },

    headerItemView: function(isFirst,marginLeft,marginRight){
        var realWidth = window.innerWidth - marginLeft - marginRight;

        return [
            '<div class="header-view" style="width: ',
            realWidth,
            'px; margin-left: ',
            marginLeft,
            'px; margin-right: ',
            marginRight,
            'px">',
            isFirst,
            '</div>'
        ].join('');
    },

    fateHeaderItemView: function(marginLeft,marginRight){
        var realWidth = window.innerWidth - marginLeft - marginRight;

        return [
            '<div class="header-view" style="width: ',
            realWidth,
            'px; margin-left: ',
            marginLeft,
            'px; margin-right: ',
            marginRight,
            'px"></div>'
        ].join('');
    },

    socialItemView:function(model){
        var name;
        if (model.get('firstname') || model.get('lastname')) {
            name = [model.get('firstname'), ' <b>',  model.get('lastname') , '</b>'].join('');
        } else if (model.get('email')){
            name = model.get('email');
        } else {
            name = model.get('phone');
        }
        var contact = ['<div style = " width: ',
            window.innerWidth,
            'px"><div class="source">',
            name].join('');
        contact = [contact, '</div></div>'].join('');
        return contact;
    },


    editContactHeader: function(title) {
        return [
            '<button class="left close-button cancel-contact touchable" id="close-button">Cancel</button><div>',
            title,
            '</div><button class="right close-button done-contact touchable">Done</button>'
        ].join('');
    },

    recentsHeader: function() {
        var content = [
            '<div class="recent-toggle"><input type="radio" id="all" name="recents-toggle" value="all" checked>',
            '<label for="all" class="first" id="recent-toggle">all</label>',
            '<input type="radio" id="missed" name="recents-toggle" value="missed">',
            '<label for="missed" class="last" id="recent-toggle">missed</label></div>',
            '<button class="right clear-button" id="clear-button"></button>'
        ];
        if (!Helpers.isMobile()) content = ['<button class="left edit-button touchable" id="recent-edit-contact"></button>'].concat(content);
        return content.join('');
    },

    chatsHeader: function() {
        var content = ['<div>Messages</div>'];
        if (!Helpers.isMobile()) content = ['<button class="left edit-button touchable" id="chats-edit-contact"></button>'].concat(content);
        return content.join('');
    },

    favoriteHeader: function() {
        if (Helpers.isMobile()) return '<div>Favorites</div>';
        return '<button class="left edit-button touchable" id="favorite-edit-contact"></button><div>Favorites</div>';
    },

    contactHeader: function(){
        var content= ['<div>All Contacts</div>',
            '<button class="right add-contact touchable" id="add-contact">',
            '<i class="fa fa-plus" id="add-contact"></i>',
            '</button>'];
        if (!Helpers.isMobile()) content = ['<button class="left edit-button touchable" id="contact-edit-contact"></button>'].concat(content);
        return content.join('');
    },

    dialHeader: function(){
        return '<div></div>';
    },
    dialNumber: function(num, abc){
        var content = ['<div class="dial-number">',num].join('');
        if (abc) {
            content = [content, '<div class="dial-number-abc">',abc,'</div>'].join('');
        }
        content = [content, '</div>'].join('');
        return content;
    },
    dialOutputView:function(num){
        return ['<div class="dial-output-view">',num,'</div>'].join('');
    },
    dialOutputViewMatchContact:function(model){
        var name;
        if (model.get('firstname') || model.get('lastname')) {
            name = model.get('firstname') + " <b>" + model.get('lastname') + "</b>";
        } else if (model.get('email')){
            name = model.get('email');
        } else {
            name = model.get('phone');
        }
        return ['<div class="dial-output-view-match-contact">',name,'</div>'].join('');
    },
    dialOutputViewButton: function(){
        return ['<div class="dial-output-view-button">',
            '<i class="fa fa-plus add-button touchable"></i>',
            '<i class="fa fa-caret-square-o-left delete-num-button touchable"></i></div>'].join('')
    },

    conversationViewHeader: function(callee){
        var name;
        if (callee){
            if (callee.get('firstname') || callee.get('lastname')) {
                name = [callee.get('firstname'), ' <b>',  callee.get('lastname') , '</b>'].join('');
            } else {
                name = callee.get('email');
            }
        } else {
            name = 'Shana <b> Ho </b>';
        }
        return ['<div class="touchable"><i class="fa fa-chevron-left fa-lg"></i><span class="conversation-callee">',
            name,
            '</span></div>'].join('');
    },

    conversationInputBar: function() {
        return [
            '<div><button class="fa fa-comments-o menu-toggle-button fade"></button>',
            '<button class="fa fa-phone menu-end-button"></button>',
            '<textarea class="input-msg" name="message"></textarea>',
            '<button class="send-text-button">Send</button></div>'
        ].join('');
    },

    settingsPage: function(appSettings) {
        var html = [
            '<div class="box">',
            '<div class="info">' + appSettings.get('firstname') + " " + appSettings.get('lastname'),
            '<button class="logout-button touchable">Log Out</button></div>',
            '<div class="desc"></div>',
            '<div class="info">ID: ' + appSettings.get('username') + "</div>",
            '<div class="desc"></div>',
            '<div class="info">Camera ',
            this.toggleSwitch("camera", appSettings.get('camera')) + '</div>',
            '<div class="info">Blur ',
            this.toggleSwitch("blur", appSettings.get('blur')) + '</div>'
        ];
        if (!Utility.isMobile()) {
            html.push('<div class="info">Notification ');
            html.push(this.toggleSwitch("notification", appSettings.get('notification')) + '</div>');
        }
        html = html.concat([
            '<div class="desc">YOU CAN BE REACHED AT</div>',
            '<div class="info">Facebook ',
            this.toggleSwitch("facebook", appSettings.get('linkAccounts').facebook) + '</div>',
            '<div class="info">Google ',
            this.toggleSwitch("google", appSettings.get('linkAccounts').google) + '</div>',
            '<div class="info">Twitter ',
            this.toggleSwitch("twitter", appSettings.get('linkAccounts').twitter) + '</div>',
            '<div class="info">Linkedin ',
            this.toggleSwitch("linkedin", appSettings.get('linkAccounts').linkedin) + '</div>',
            '<div class="info">Github ',
            this.toggleSwitch("github", appSettings.get('linkAccounts').github) + '</div>',
            '<div class="info">Yammer ',
            this.toggleSwitch("yammer", appSettings.get('linkAccounts').yammer) + '</div>'
        ]);
        if (Helpers.isDev()) {
            html = html.concat([
                '<div class="desc">Testing</div>',
                '<div class="info"><button class="call-button">Call</button>',
                '<button class="incoming-button">Incoming</button>',
                '<button class="connected-button">Connected</button>',
                '<button class="conversations-button">Message</button></div>',
                '</div>'
            ]);
        }
        return html.join('');
    },

    abcButtons :function (){
        return '<button id="A">A</button><button id="B">B</button><button id="C">C</button><button id="D">D</button><button id="E">E</button><button id="F">F</button><button id="G">G</button><button id="H">H</button><button id="I">I</button><button id="J">J</button><button id="K">K</button><button id="L">L</button><button id="M">M</button><button id="N">N</button><button id="O">O</button><button id="P">P</button><button id="Q">Q</button><button id="R">R</button><button id="S">S</button><button id="T">T</button><button id="U">U</button><button id="V">V</button><button id="W">W</button><button id="X">X</button><button id="Y">Y</button><button id="Z">Z</button><button id="#">#</button>'
    },

    navigationButton : function (options, badge) {
        return [
            '<div><span class="icon ',
            options.caption.toLowerCase(),
            '"><div class="badge">',
            badge,
            '</div>',
            options.icon,
            '</span><br />',
            options.caption,
            '</div>'
        ].join('');
    },

    getFacebookInvite: function(contact) {
        if (!contact.facebook || !contact.dcr) return '';
        return [
            '<a class="touchable button invite-button" target="_blank" href="',
            "https://www.facebook.com/dialog/send?",
            "app_id=648143008577417",
            "&link=",
            encodeURI("https://beepe.me/welcome?r="),
            contact.dcr,
            "&to=",
            contact.facebook.id,
            "&display=popup",
            "&redirect_uri=",
            encodeURI("https://beepe.me/invitation"),
            '">Invite</a>'
        ].join('');
    },
    getSMSInvite: function(contact) {
        if (!Helpers.isMobile() || !contact.phone || !contact.dcr) return '';
        return [
            '<a class="touchable button invite-button" target="_blank" href="',
            "sms:",
            encodeURI(contact.phone),
            encodeURI("?body=Hey, call me back on "),
            encodeURI("https://beepe.me/welcome?r="),
            contact.dcr,
            '">Invite</a>'
        ].join('');
    },
    getEmailInvite: function (contact) {
        if (!contact.email || !contact.dcr) return '';
        return [
            '<a class="touchable button invite-button" target="_blank" href="',
            "mailto:",
            encodeURI(contact.email),
            encodeURI("?subject=I just added you on my Beepe contact list"),
            encodeURI("&body=Now you can call me back on \n\n"),
            encodeURI("https://beepe.me/welcome?r="),
            contact.dcr,
            '">Invite</a>'
        ].join('');
    },
    getInvite: function (contact) {
        if (!contact.dcr) return '';
        return [
            '<div class="inviteLink">',
            '<h3>Start chatting now.<br>Send this invitation URL to ',
            contact.firstname || contact.lastname,
            '.</h3>',
            'URL:<br>',
            encodeURI("https://beepe.me/welcome?r="),
            contact.dcr,
            '</div>'
        ].join('');
    },
    addSocialContact: function (formObject, source) {
        var icon = 'fa-' + source + '-square';
        if (source=='google') icon = 'fa-google-plus-square';
        var html = '<div class="info import-contact touchable" id="' + source + '">' +
            '<i class="fa ' + icon + ' fa-lg import-contact" id="' + source + '"></i>';
        if (formObject[source]) {
            var obj = formObject[source];
            html += '<span class="import-contact touchable" id="' + source + '">  ' + obj.firstname + ' ' + obj.lastname +'</span>';
            html += this.removeButton(source);
            if (source=='facebook') html += this.getFacebookInvite(formObject);
            html += '</div>';
        } else {
            html += '<span class="import-contact touchable" id="' + source + '">  New ' + Helpers.capitalize(source) + ' Contact</span>';
            html += this.nextButton(source) + '</div>';
        }
        return html;
    }
};