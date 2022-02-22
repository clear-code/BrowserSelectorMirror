FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: dev

all: BrowserSelectorChrome.zip

clean:
	rm -f BrowserSelectorChrome.zip
	rm -f BrowserSelectorChromeDev.zip
	rm -rf dev

dev:
	rm -rf dev
	mkdir -p dev
	cp -R _locales misc *.js dev/
	cp manifest.json.dev dev/manifest.json
	cd dev && zip -9 - $(FILES) > ../BrowserSelectorChromeDev.zip

BrowserSelectorChrome.zip: $(FILES)
	zip -9 - $(FILES) > $@
