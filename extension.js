const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const St = imports.gi.St;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;


function power(httpSession, on) {
    var url = 'http://192.168.1.104:9123/elgato/lights';
    
    let message = Soup.Message.new('PUT', url);
    
    //'{"numberOfLights":1,"lights":[{"on":1}]}'
    var body = JSON.stringify({"lights":[{"on":on?1:0}]});
    
    message.set_request('application/json', 2, body);
    httpSession.queue_message(message, function (httpSession, message){
        global.log(message.response_body.data);
    });
}

const TimeButton = new Lang.Class({
    Name: "ElgatoKeyLight",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(null, "ElgatoKeyLight");
        this._httpSession = new Soup.Session();

        let gicon = Gio.icon_new_for_string(Me.path + "/icons/icon.png");
        this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });

        this.actor.add_actor(this.icon);

        // Menu
        let brightnessItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        
        let brightnessSlider = new Slider.Slider(0);
        brightnessSlider.connect('value-changed', Lang.bind(this, this._sliderChanged))
        brightnessItem.actor.add(new St.Icon({
            icon_name: "display-brightness-symbolic",
            style_class: 'popup-menu-icon'}));
        brightnessItem.actor.add(brightnessSlider.actor, { expand: true });
        this.menu.addMenuItem(brightnessItem);
        
        let switchmenuitem = new PopupMenu.PopupSwitchMenuItem('PopupSwitchMenuItem');
        switchmenuitem.connect('toggled', Lang.bind(this, function(object, value) {
            power(this._httpSession, value);
		}));

        this.menu.addMenuItem(switchmenuitem);
    },
    _sliderChanged: function(slider, value) {
        //global.log(value);
    },
    toggle: function() {
    }
});

function init() {
}

const IDENT = "elgato-key-light-vidstige";

function enable() {
    let indicator = new TimeButton();
    Main.panel.addToStatusArea(IDENT, indicator);

    // change icon
    //Main.panel.statusArea["should-be-a-unique-string2"].icon.icon_name = "appointment-soon";

    // show
    Main.panel.statusArea[IDENT].actor.visible = true;
}

function disable() {
    // you could also track "indicator" and just call indicator.destroy()
    Main.panel.statusArea[IDENT].destroy();
}