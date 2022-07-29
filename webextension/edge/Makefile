FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: dev enterprise-dev

all: BrowserSelectorEdge.zip

clean:
	rm -f BrowserSelectorEdge.zip
	rm -f BrowserSelectorEdgeDev.zip
	rm -f BrowserSelectorEdgeEnterpriseDev.zip
	rm -rf dev
	rm -rf enterprise-dev

dev:
	rm -rf dev
	mkdir -p dev
	cp -R _locales misc *.js dev/
	cp manifest.json.dev dev/manifest.json
	cd dev && zip -9 - $(FILES) > ../BrowserSelectorEdgeDev.zip

enterprise-dev:
	rm -rf enterprise-dev
	mkdir -p enterprise-dev
	cp -R _locales misc *.js enterprise-dev/
	sed -i -E -e 's/BrowserSelector/BrowserSelector Enterrpise Developer Edition/g' enterprise-dev/_locales/*/messages.json
	cp manifest.json enterprise-dev/manifest.json
	cd enterprise-dev && zip -9 - $(FILES) > ../BrowserSelectorEdgeEnterpriseDev.zip

BrowserSelectorEdge.zip: $(FILES)
	zip -9 - $(FILES) > $@
