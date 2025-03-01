import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as main from 'resource:///org/gnome/shell/ui/main.js';

let originalClockDisplay;
let formatClockDisplay;
let timeoutID = 0;

export default class PanelDateFormatExtension extends Extension {
  enable() {
    this._settings = this.getSettings();

    // Load CSS
    this._stylesheet = Gio.File.new_for_path(`${this.path}/stylesheet.css`);
    St.ThemeContext.get_for_stage(global.stage).get_theme().load_stylesheet(this._stylesheet);

    originalClockDisplay = main.panel.statusArea.dateMenu._clockDisplay;
    formatClockDisplay = new St.Label({ style_class: "clock" });
    formatClockDisplay.clutter_text.y_align = Clutter.ActorAlign.CENTER;

    originalClockDisplay.hide();
    originalClockDisplay
      .get_parent()
      .insert_child_below(formatClockDisplay, originalClockDisplay);

    // Connect to settings changes
    this._settingsChangedId = this._settings.connect('changed', this._onSettingsChanged.bind(this));

    // Apply initial width setting
    this._updateWidthSetting();

    timeoutID = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      this._tick();
      return GLib.SOURCE_CONTINUE;
    });

    // Initial update
    this._tick();
  }

  disable() {
    // Unload CSS
    if (this._stylesheet) {
      St.ThemeContext.get_for_stage(global.stage).get_theme().unload_stylesheet(this._stylesheet);
      this._stylesheet = null;
    }

    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId);
      this._settingsChangedId = null;
    }

    if (timeoutID) {
      GLib.Source.remove(timeoutID);
      timeoutID = 0;
    }

    if (originalClockDisplay && formatClockDisplay) {
      originalClockDisplay.get_parent().remove_child(formatClockDisplay);
      originalClockDisplay.show();
      formatClockDisplay = null;
    }

    this._settings = null;
  }

  _onSettingsChanged() {
    this._updateWidthSetting();
  }

  _updateWidthSetting() {
    if (this._settings.get_boolean('fixed-width')) {
      let width = this._settings.get_int('width');
      formatClockDisplay.width = width;
      formatClockDisplay.clutter_text.x_align = Clutter.ActorAlign.CENTER;
    } else {
      // Remove width constraint
      formatClockDisplay.width = -1;
      formatClockDisplay.clutter_text.x_align = Clutter.ActorAlign.START;
    }
  }

  _tick() {
    let text;
    if (this._settings.get_boolean('use-traditional')) {
      // Use traditional format
      let format = this._settings.get_string('format');
      let now = GLib.DateTime.new_now_local();
      text = now.format(format);
    } else {
      // Use fuzzy time
      text = this._getFuzzyTime();
    }

    formatClockDisplay.set_text(text);
    return true;
  }

  _getFuzzyTime() {
    let now = new Date();
    let rawHour = now.getHours(); // 0–23 format
    let minute = now.getMinutes();

    // Get settings
    const precision = this._settings.get_string('precision');
    const capitalization = this._settings.get_string('capitalization');
    const useSpecialTimes = this._settings.get_boolean('use-special-times');

    // Convert to 12-hour numeric values
    let currentHour12 = rawHour % 12 || 12;
    let nextHour12 = (rawHour + 1) % 12 || 12;

    const numbersToWords = {
      1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
      6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
      11: "eleven", 12: "twelve"
    };

    let hourWord = numbersToWords[currentHour12];
    let nextHourWord = numbersToWords[nextHour12];

    let fuzzyTime = "";

    // Handle different precision levels
    if (precision === 'hour') {
      // Use actual hour (no rounding)
      if (hourWord === "twelve" && useSpecialTimes) {
        if (rawHour === 0) {
          fuzzyTime = "midnight";
        } else if (rawHour === 12) {
          fuzzyTime = "noon";
        } else {
          fuzzyTime = `${hourWord} o'clock`;
        }
      } else {
        fuzzyTime = `${hourWord} o'clock`;
      }
    } else if (precision === 'half-hour') {
      // Round to nearest half hour
      if (minute < 15) { // 0–14 - display X o'clock
        if (hourWord === "twelve" && useSpecialTimes) {
          if (rawHour === 0) {
            fuzzyTime = "midnight";
          } else if (rawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${hourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${hourWord} o'clock`;
        }
      } else if (minute < 45) { // 15–44 - display half past
        fuzzyTime = `half past ${hourWord}`;
      } else { // 45–59 - display next hour o'clock
        if (nextHourWord === "twelve" && useSpecialTimes) {
          let nextRawHour = (rawHour + 1) % 24;
          if (nextRawHour === 0) {
            fuzzyTime = "midnight";
          } else if (nextRawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${nextHourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${nextHourWord} o'clock`;
        }
      }
    } else if (precision === 'quarter-hour') {
      // Round to nearest quarter hour
      if (minute < 8) { // 0–7 - display X o'clock
        if (hourWord === "twelve" && useSpecialTimes) {
          if (rawHour === 0) {
            fuzzyTime = "midnight";
          } else if (rawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${hourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${hourWord} o'clock`;
        }
      } else if (minute < 23) { // 8–22 - display quarter past
        fuzzyTime = `quarter past ${hourWord}`;
      } else if (minute < 38) { // 23–37 - display half past
        fuzzyTime = `half past ${hourWord}`;
      } else if (minute < 53) { // 38–52 - display quarter to
        fuzzyTime = `quarter to ${nextHourWord}`;
      } else { // 53–59 - display next hour o'clock
        if (nextHourWord === "twelve" && useSpecialTimes) {
          let nextRawHour = (rawHour + 1) % 24;
          if (nextRawHour === 0) {
            fuzzyTime = "midnight";
          } else if (nextRawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${nextHourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${nextHourWord} o'clock`;
        }
      }
    } else if (precision === 'five-minute') {
      // Round to nearest 5 minutes
      if (minute < 3) {
        if (hourWord === "twelve" && useSpecialTimes) {
          if (rawHour === 0) {
            fuzzyTime = "midnight";
          } else if (rawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${hourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${hourWord} o'clock`;
        }
      } else if (minute < 8) {
        fuzzyTime = `five past ${hourWord}`;
      } else if (minute < 13) {
        fuzzyTime = `ten past ${hourWord}`;
      } else if (minute < 18) {
        fuzzyTime = `quarter past ${hourWord}`;
      } else if (minute < 23) {
        fuzzyTime = `twenty past ${hourWord}`;
      } else if (minute < 28) {
        fuzzyTime = `twenty-five past ${hourWord}`;
      } else if (minute < 33) {
        fuzzyTime = `half past ${hourWord}`;
      } else if (minute < 38) {
        fuzzyTime = `twenty-five to ${nextHourWord}`;
      } else if (minute < 43) {
        fuzzyTime = `twenty to ${nextHourWord}`;
      } else if (minute < 48) {
        fuzzyTime = `quarter to ${nextHourWord}`;
      } else if (minute < 53) {
        fuzzyTime = `ten to ${nextHourWord}`;
      } else if (minute < 58) {
        fuzzyTime = `five to ${nextHourWord}`;
      } else {
        if (nextHourWord === "twelve" && useSpecialTimes) {
          let nextRawHour = (rawHour + 1) % 24;
          if (nextRawHour === 0) {
            fuzzyTime = "midnight";
          } else if (nextRawHour === 12) {
            fuzzyTime = "noon";
          } else {
            fuzzyTime = `${nextHourWord} o'clock`;
          }
        } else {
          fuzzyTime = `${nextHourWord} o'clock`;
        }
      }
    } else if (precision === 'minute') {
      // TODO: make it make sense
      fuzzyTime = `${hourWord} o'clock`;
    }

    // Apply capitalization
    if (capitalization === 'first') {
      fuzzyTime = fuzzyTime.charAt(0).toUpperCase() + fuzzyTime.slice(1);
    } else if (capitalization === 'all') {
      fuzzyTime = fuzzyTime.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    } else if (capitalization === 'uppercase') {
      fuzzyTime = fuzzyTime.toUpperCase();
    } else if (capitalization === 'none') {
      // lowercase
    }

    return fuzzyTime;
  }
}
