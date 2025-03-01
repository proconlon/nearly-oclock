.PHONY: install uninstall

EXTENSION_UUID = nearly-oclock@proconlon
EXTENSION_DIR = ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)

install:
	mkdir -p $(EXTENSION_DIR)/schemas
	cp -r extension.js prefs.js metadata.json stylesheet.css schemas/* $(EXTENSION_DIR)/
	glib-compile-schemas $(EXTENSION_DIR)/schemas/

uninstall:
	rm -rf $(EXTENSION_DIR)
