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

class ElgatoKeyLight {
    constructor(url, httpSession) {
        this._url = url;
        this._httpSession = httpSession;
    }
    update(light) {
        let message = Soup.Message.new('PUT', this._url + '/elgato/lights');
        var body = JSON.stringify({"lights": [light]});
        
        message.set_request('application/json', 2, body);
        this._httpSession.queue_message(message, function (httpSession, message) {
            global.log(message.response_body.data);
        });
    }
    status(callback) {
        let message = Soup.Message.new('GET', this._url + '/elgato/lights');
        this._httpSession.queue_message(message, function (httpSession, message) {
            const lights = JSON.parse(message.response_body.data).lights;
            callback(lights[0]);
        });
    }
}

const ElgatoKeyLightButton = new Lang.Class({
    Name: "ElgatoKeyLight",
    Extends: PanelMenu.Button,

    _init: function (config) {
        this.parent(null, "ElgatoKeyLight");
        this._elgatoKeyLight = new ElgatoKeyLight(config.url, new Soup.Session());

        let gicon = Gio.icon_new_for_string(Me.path + "/icons/icon.png");
        this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });

        this.actor.add_actor(this.icon);

        // Brightness slider
        const brightnessItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        const brightnessSlider = new Slider.Slider(0);
        brightnessSlider.connect('value-changed', debounce(this._brightnessChanged.bind(this), 500));
        brightnessItem.actor.add(new St.Icon({
            gicon: Gio.icon_new_for_string(Me.path + "/icons/brightness-64x64.png"),
            style_class: 'popup-menu-icon'}));
        brightnessItem.actor.add(brightnessSlider.actor, { expand: true });
        this.menu.addMenuItem(brightnessItem);

        // Temperature slider
        const temperatureItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        const temperatureSlider = new Slider.Slider(0);
        temperatureSlider.connect('value-changed', debounce(this._temperatureChanged.bind(this), 500));
        temperatureItem.actor.add(new St.Icon({
            gicon: Gio.icon_new_for_string(Me.path + "/icons/thermometer-64x64.png"),
            style_class: 'popup-menu-icon'}));
        temperatureItem.actor.add(temperatureSlider.actor, { expand: true });
        this.menu.addMenuItem(temperatureItem);

        // On/off switch
        let switchmenuitem = new PopupMenu.PopupSwitchMenuItem('Light', { activate: false });
        switchmenuitem.connect('toggled', this.toggle.bind(this));
        this.menu.addMenuItem(switchmenuitem);

        // Query current status
        this._elgatoKeyLight.status(function(light) {
            global.log(light.brightness, light.temperature, light.on);
            brightnessSlider.setValue(light.brightness / 100.0);
            const temperature = 1000000 / light.temperature;
            temperatureSlider.setValue((temperature - 2900) / (7000 - 2900));
            switchmenuitem.setToggleState(light.on == "1")
        });
    },
    _brightnessChanged: function(slider, value) {
        this._elgatoKeyLight.update({ "brightness": 100 * value | 0 });
    },
    _temperatureChanged: function(slider, value) {
        const temperature = 2900 + value * (7000 - 2900);
        this._elgatoKeyLight.update({ "temperature": 1000000 / temperature | 0 })
    },
    toggle: function(object, value) {
        this._elgatoKeyLight.update({ "on": value ? 1 : 0 });
    }
});

function init() {
}

const IDENT = "elgato-key-light-vidstige";

function enable() {
    /*
    // Get the GSchema source so we can lookup our settings
    let gschema = Gio.SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
    );
   
    const schema = 'org.gnome.shell.extensions.elgatokeylight.gsettings';
    if (gschema.list_schemas(false).indexOf(schema) == -1)
        throw 'Schema "' + schema + '" not found.';
    let settings = new Gio.Settings({ settings_schema: gschema.lookup(schema, false) });
    global.log(settings.get_int('url'));*/
    let configPath = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'elgato-key-light', 'config.json']);
    let configRaw = String(GLib.file_get_contents(configPath)[1]);
    let config = JSON.parse(configRaw);

    let indicator = new ElgatoKeyLightButton(config);
    Main.panel.addToStatusArea(IDENT, indicator);

    // show
    Main.panel.statusArea[IDENT].actor.visible = true;
}

function disable() {
    // you could also track "indicator" and just call indicator.destroy()
    Main.panel.statusArea[IDENT].destroy();
}