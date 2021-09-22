FILES = manifest.json \
	_locales/ja/messages.json \
	misc/128x128.png \
	background.js

all: BrowserSelectorEdge.zip

clean:
	rm -f BrowserSelectorEdge.zip

BrowserSelectorEdge.zip: $(FILES)
	zip -9 - $(FILES) > $@
