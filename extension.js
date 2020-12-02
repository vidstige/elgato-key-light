const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const St = imports.gi.St;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

function power(on) {
        
}

const TimeButton = new Lang.Class({
    Name: "TimeButton",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(null, "TimeButton");

        // Icon
        this.icon = new St.Icon({
            icon_name: "appointment-soon",
            style_class: "system-status-icon"
        });
        //let gicon = Gio.icon_new_for_string(Me.path + "/icons/icon.png");
        //this.icon = new St.Icon({ gicon });

        this.actor.add_actor(this.icon);

        // Menu
        this._item = new PopupMenu.PopupBaseMenuItem({ activate: false })
        this.menu.addMenuItem(this._item);
        this._slider = new Slider.Slider(0);
        this._item.actor.add(this.icon);
        this._item.actor.add(this._slider.actor, { expand: true });
        
        //var menuItem = new PopupMenu.PopupBaseMenuItem();
        /*let cancelButton = new St.Button({
            child: new St.Icon({ icon_name: 'appointment-soon' }),
            style_class: 'system-menu-action',
        });
        menuItem.actor.add_actor(cancelButton);
        */
        let switchmenuitem = new PopupMenu.PopupSwitchMenuItem('PopupSwitchMenuItem');
        switchmenuitem.connect('toggled', Lang.bind(this, function(object, value) {
			// We will just change the text content of the label
			if (value) {
				label.set_text('On');
			} else {
				label.set_text('Off');
			}
		}));

        this.menu.addMenuItem(switchmenuitem);
        

        //this.menu.addMenuItem(menuItem);
    },
    toggle: function() {

    }
});

function init() {
}

function enable() {
    let indicator = new TimeButton();
    Main.panel.addToStatusArea("should-be-a-unique-string2", indicator);

    // change icon
    //Main.panel.statusArea["should-be-a-unique-string2"].icon.icon_name = "appointment-soon";

    // show
    Main.panel.statusArea["should-be-a-unique-string2"].actor.visible = true;
}

function disable() {
    // you could also track "indicator" and just call indicator.destroy()
    Main.panel.statusArea["should-be-a-unique-string2"].destroy();
}