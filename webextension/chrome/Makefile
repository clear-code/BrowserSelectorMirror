FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

all: BrowserSelectorChrome.zip

clean:
	rm -f BrowserSelectorChrome.zip

BrowserSelectorChrome.zip: $(FILES)
	zip -9 - $(FILES) > $@
