# Nearly O'Clock Extension for GNOME Shell

Take a more relaxed approach to life! Have no idea what time it is! It's pretentious because it's in lowercase!!!

![screenshot](./screenshot.png?raw=true)

This extension replaces your GNOME Shell clock with a **fuzzy time** display.  
Instead of precise numbers, you'll see "human-friendly" phrases like: _quarter past ten_ instead of _10:17_.

| Time         | Fuzzy Time       |
|--------------|------------------|
| **12:00 AM** | `midnight`       |
| **12:03 AM** | `five past 12`   |
| **12:00 PM** | `noon`           |
| **12:46 PM** | `quarter to 1`   |
| **11:00 PM** | `11 o'clock`     |


## **Installation Instructions**

### **1. Clone the Repository**
Run the following command to install the extension manually:

```sh
git clone https://github.com/proconlon/nearly-oclock.git ~/.local/share/gnome-shell/extensions/nearly-oclock@proconlon
```

### **2. Compile the GSettings Schema**
The schema file (`schemas/org.gnome.shell.extensions.nearly-oclock.gschema.xml`) must be compiled to be used by GNOME Shell:

```sh
glib-compile-schemas ~/.local/share/gnome-shell/extensions/nearly-oclock@proconlon/schemas/
```

### **3. Enable the Extension**

Log out and log back in to restart GNOME Shell, then enable the extension with:

```sh
gnome-extensions enable nearly-oclock@proconlon
```

It will probably appear in **GNOME Tweaks** or **Extensions** under the name **Nearly O'Clock*.

All set! Now you can tell time like an annoying person!

## **Uninstalling**
To remove the extension, run:

```sh
gnome-extensions disable nearly-oclockproconlon
rm -rf ~/.local/share/gnome-shell/extensions/nearly-oclock@proconlon
```

---

This is a modified fork of the **[Panel Date Format extension](https://extensions.gnome.org/extension/1462/panel-date-format/)**.


