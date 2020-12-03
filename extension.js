const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const St = imports.gi.St;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;
const GLib = imports.gi.GLib;

function debounce(func, wait, options = {priority: GLib.PRIORITY_DEFAULT}) {
    let sourceId;
    return function (...args) {
        const debouncedFunc = () => {
            sourceId = null;
            func.apply(this, args);
        };
        if (sourceId)
            GLib.Source.remove(sourceId);
        sourceId = GLib.timeout_add(options.priority, wait, debouncedFunc);
    };
}

function updateElgatoKeyLight(httpSession, light) {
    var url = 'http://192.168.1.104:9123/elgato/lights';
    
    let message = Soup.Message.new('PUT', url);
    
    //'{"numberOfLights":1,"lights":[{"on":1}]}'
    var body = JSON.stringify({"lights": [light]});
    
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

        // Brightness slider
        let brightnessItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        let brightnessSlider = new Slider.Slider(0);
        brightnessSlider.connect('value-changed', debounce(this._brightnessChanged.bind(this), 500));
        brightnessItem.actor.add(new St.Icon({
            gicon: Gio.icon_new_for_string(Me.path + "/icons/brightness-64x64.png"),
            style_class: 'popup-menu-icon'}));
        brightnessItem.actor.add(brightnessSlider.actor, { expand: true });
        this.menu.addMenuItem(brightnessItem);

        // Temperature slider
        let temperatureItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        let temperatureSlider = new Slider.Slider(0);
        temperatureSlider.connect('value-changed', this._brightnessChanged.bind(this));
        temperatureItem.actor.add(new St.Icon({
            gicon: Gio.icon_new_for_string(Me.path + "/icons/thermometer-64x64.png"),
            style_class: 'popup-menu-icon'}));
        temperatureItem.actor.add(temperatureSlider.actor, { expand: true });
        this.menu.addMenuItem(temperatureItem);

        // On/off switch
        let switchmenuitem = new PopupMenu.PopupSwitchMenuItem('Light', { activate: false });
        switchmenuitem.connect('toggled', Lang.bind(this, function(object, value) {
            updateElgatoKeyLight(this._httpSession, { "on": value ? 1 : 0 });
		}));

        this.menu.addMenuItem(switchmenuitem);
    },
    _brightnessChanged: function(slider, value) {
        updateElgatoKeyLight(this._httpSession, { "brightness": 100*value | 0 });
    },
    _temperatureChanged: function(slider, value) {
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