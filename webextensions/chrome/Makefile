FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

.PHONY: zip dev enterprise-dev

all: zip

clean:
	rm -f *.zip
	rm -rf dev
	rm -rf enterprise-dev

dev:
	rm -rf dev
	mkdir -p dev
	cp -R _locales misc *.js dev/
	cp manifest.json.dev dev/manifest.json
	rm -f BrowserSelectorChromeDev.zip
	cd dev && zip -9 - $(FILES) > ../BrowserSelectorChromeDev.zip

enterprise-dev:
	rm -rf enterprise-dev
	mkdir -p enterprise-dev
	cp -R _locales misc *.js enterprise-dev/
	sed -i -E -e 's/BrowserSelector/BrowserSelector Enterrpise Developer Edition/g' enterprise-dev/_locales/*/messages.json
	cp manifest.json enterprise-dev/manifest.json
	rm -f BrowserSelectorChromeEnterpriseDev.zip
	cd enterprise-dev && zip -9 - $(FILES) > ../BrowserSelectorChromeEnterpriseDev.zip

zip: $(FILES)
	rm -f BrowserSelectorChrome.zip
	zip -9 - $(FILES) > BrowserSelectorChrome.zip
