"use strict";

/*
 * CONSTANT
 */
var BROWSER = 'firefox';
var SERVER_NAME = 'com.clear_code.browserselector_talk';

var Redirector = {

	init: async function() {
		Redirector.isNewTab = {};
		await Redirector.handleStartup();
		Redirector.listen();
		console.log('Running as BrowserSelector Talk client');
	},

	listen: function() {
		browser.webRequest.onBeforeRequest.addListener(
			Redirector.onBeforeRequest,
			{
				urls: ['<all_urls>'],
				types: ['main_frame']
			},
			['blocking']
		);

		/* Tab book-keeping for intelligent tab handlings */
		browser.tabs.onCreated.addListener(tab => {
			Redirector.isNewTab[tab.id] = 1;
		});

		browser.tabs.onUpdated.addListener((id, info, tab) => {
			if (info.status === 'complete') {
				if (info.url && !/^(about:(blank|newtab|home))$/.test(info.url)) {
					delete Redirector.isNewTab[tab.id];
				}
			}
		});
	},

	/*
	 * Check if the given URL should be opened in another browser.
	 *
	 * >>> "Q firefox https://google.com"
	 * {"status":"OK", "open":1, "close_tab":1}
	 */
	check: async function(url) {
		var resp;
		var query = new String('Q ' + BROWSER + ' ' + url);
		try {
			resp = await browser.runtime.sendNativeMessage(SERVER_NAME, query);
		} catch (err) {
			console.log(`Query error: ${err}`);
			return {};
		}
		console.log(`* Response was ${JSON.stringify(resp)}`);
		return resp;
	},

	/*
	 * Since onBeforeRequest() cannot handle Firefox's startup tabs,
	 * process those tabs manually on startup.
	 */
	handleStartup: async function(config) {
		var tabs = await browser.tabs.query({});
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var url = tab.pendingUrl || tab.url;
			console.log(`handleStartup ${url} (tab=${tab.id})`);

			if (!/https?:/.test(url)){
				console.log("* Ignore non-HTTP/HTTPS URL");
				continue;
			}

			var resp = await Redirector.check(url);
			if (resp.open && resp.close_tab) {
				console.log(`* Close tab#${tab.id}`);
				browser.tabs.remove(tab.id);
			}
		}
	},

	onBeforeRequest: async function(details) {
		console.log(`onBeforeRequest ${details.url} (tab=${details.tabId})`);

		if (details.tabId < 0) {
			console.log(`* Ignore internal request`);
			return;
		}

		if (!/^https?:/.test(details.url)) {
			console.log("* Ignore non-HTTP/HTTPS URL");
			return;
		}

		var resp = await Redirector.check(details.url);
		if (resp.open) {
			if (resp.close_tab && Redirector.isNewTab[details.tabId]) {
				console.log(`* Close tab#${details.tabId}`);
				delete Redirector.isNewTab[details.tabId];
				await browser.tabs.remove(details.tabId).catch(() => null);
			}
			return {cancel: true};
		}
	}
};

Redirector.init();
