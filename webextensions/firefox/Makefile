FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: xpi

all: xpi

clean:
	rm -f *.zip

xpi: $(FILES)
	rm -f *.xpi
	zip -9 - $(FILES) > BrowserSelectorFirefox.xpi
