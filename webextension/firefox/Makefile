FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

all: BrowserSelectorFirefox.zip

clean:
	rm -f BrowserSelectorFirefox.zip

BrowserSelectorFirefox.zip: $(FILES)
	zip -9 - $(FILES) > $@
