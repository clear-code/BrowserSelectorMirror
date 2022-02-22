FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: dev

all: BrowserSelectorEdge.zip

clean:
	rm -f BrowserSelectorEdge.zip
	rm -f BrowserSelectorEdgeDev.zip
	rm -rf dev

dev:
	rm -rf dev
	mkdir -p dev
	cp -R _locales misc *.js dev/
	cp manifest.json.dev dev/manifest.json
	cd dev && zip -9 - $(FILES) > ../BrowserSelectorEdgeDev.zip

BrowserSelectorEdge.zip: $(FILES)
	zip -9 - $(FILES) > $@
