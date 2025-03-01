'use strict';

import GObject from 'gi://GObject';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Custom spin button with plus/minus buttons
const CustomSpinButton = GObject.registerClass(
class CustomSpinButton extends Gtk.Box {
    _init(settings, key, min, max, step) {
        super._init({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            css_classes: ['fuzzy-time-spinbutton'],
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER
        });
        
        this._settings = settings;
        this._key = key;
        this._min = min;
        this._max = max;
        this._step = step;
        
        // Minus button
        this._minusButton = new Gtk.Button({
            icon_name: 'list-remove-symbolic',
            css_classes: ['down'],
            valign: Gtk.Align.CENTER
        });
        
        // Use a simple entry field instead of a spin button
        this._entry = new Gtk.Entry({
            text: settings.get_int(key).toString(),
            input_purpose: Gtk.InputPurpose.NUMBER,
            width_chars: 4,
            max_width_chars: 4,
            xalign: 0.5, // Center text
            hexpand: true,
            valign: Gtk.Align.CENTER
        });
        
        // Plus button
        this._plusButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            css_classes: ['up'],
            valign: Gtk.Align.CENTER
        });
        
        // Add widgets to the box
        this.append(this._minusButton);
        this.append(this._entry);
        this.append(this._plusButton);
        
        // Connect signals
        this._minusButton.connect('clicked', () => {
            let value = parseInt(this._entry.get_text()) || 0;
            if (value > this._min) {
                value = Math.max(this._min, value - this._step);
                this._entry.set_text(value.toString());
                this._updateSetting();
            }
        });
        
        this._plusButton.connect('clicked', () => {
            let value = parseInt(this._entry.get_text()) || 0;
            if (value < this._max) {
                value = Math.min(this._max, value + this._step);
                this._entry.set_text(value.toString());
                this._updateSetting();
            }
        });
        
        this._entry.connect('activate', () => {
            this._updateSetting();
        });
        
        this._entry.connect('notify::has-focus', () => {
            if (!this._entry.has_focus)
                this._updateSetting();
        });
        
    }
    
    _updateSetting() {
        let value = parseInt(this._entry.get_text()) || 0;
        value = Math.max(this._min, Math.min(this._max, value));
        this._entry.set_text(value.toString());
        this._settings.set_int(this._key, value);
    }
});

export default class FuzzyTimePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Create a preferences page
        const page = new Adw.PreferencesPage();
        
        // Create a preferences group for width settings
        const widthGroup = new Adw.PreferencesGroup({
            title: 'Width Settings'
        });
        
        // Add fixed width toggle
        const fixedWidthRow = new Adw.ActionRow({
            title: 'Use Fixed Width',
            subtitle: 'Prevents the clock from changing width when time changes'
        });
        
        const fixedWidthToggle = new Gtk.Switch({
            active: settings.get_boolean('fixed-width'),
            valign: Gtk.Align.CENTER
        });
        
        settings.bind(
            'fixed-width',
            fixedWidthToggle,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        
        fixedWidthRow.add_suffix(fixedWidthToggle);
        fixedWidthRow.activatable_widget = fixedWidthToggle;
        widthGroup.add(fixedWidthRow);
        
        // Add width spinner with custom buttons
        const widthRow = new Adw.ActionRow({
            title: 'Clock Width',
            subtitle: 'Width in pixels when fixed width is enabled'
        });
        
        const customSpinButton = new CustomSpinButton(settings, 'width', 50, 500, 10);
        widthRow.add_suffix(customSpinButton);
        widthGroup.add(widthRow);
        
        // Add the group to the page
        page.add(widthGroup);
        
        // Add the page to the window
        window.add(page);
    }
}
