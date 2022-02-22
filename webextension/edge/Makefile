FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: dev

all: BrowserSelectorEdge.zip

clean:
	rm -f BrowserSelectorEdge.zip
	rm -rf dev

dev:
	rm -rf dev
	mkdir -p dev
	cp -R _locales misc *.js dev/
	cp manifest.json.dev dev/manifest.json

BrowserSelectorEdge.zip: $(FILES)
	zip -9 - $(FILES) > $@
