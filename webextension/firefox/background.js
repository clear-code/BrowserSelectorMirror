"use strict";

/*
 * CONSTANT
 */
var BROWSER = 'firefox';
var SERVER_NAME = 'com.clear_code.browserselector_talk';

var RecentlyRedirectedUrls = {
	entriesByTabId: new Map(),
	timeoutMsec: 1000,

	init() {
		chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
			this.entriesByTabId.delete(tabId);
		});
	},

	add(url, tabId) {
		const now = Date.now();

		// This nested history is designed for better performance to delete
		// obsolete entries when tabs are closed.
		const urlEntries = this.entriesByTabId.get(tabId) || new Map();
		urlEntries.set(url, now);
		this.entriesByTabId.set(tabId, urlEntries);

		setTimeout(() => {
			if (urlEntries.get(url) != now)
				return;
			this.delete(url, tabId);
		}, this.timeoutMsec);
	},

	delete(url, tabId) {
		const urlEntries = this.entriesByTabId.get(tabId);
		if (!urlEntries)
			return;

		urlEntries.delete(url);
		if (urlEntries.size == 0) {
			this.entriesByTabId.delete(tabId);
		}
	},

	canRedirect(url, tabId) {
		const urlEntries = this.entriesByTabId.get(tabId);
		if (!urlEntries)
			return true;

		const now = Date.now();
		const lastAdded = urlEntries.get(url);
		if (lastAdded && now - lastAdded < this.timeoutMsec) {
			urlEntries.set(url, now);
			console.log('Recently redirected: ', url, tabId);
			return false;
		}

		this.delete(url, tabId);
		return true;
	},
};

var Redirector = {

	init: async function() {
		Redirector.newTabIds = new Set();
		RecentlyRedirectedUrls.init();
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
			Redirector.newTabIds.add(tab.id);
		});

		browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
			Redirector.newTabIds.delete(tabId);
		});

		browser.tabs.onUpdated.addListener((id, info, tab) => {
			if (info.status === 'complete') {
				if (info.url && !/^(about:(blank|newtab|home))$/.test(info.url)) {
					Redirector.newTabIds.delete(tab.id);
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
	check: async function(url, tabId) {
		var resp;
		var query = new String('Q ' + BROWSER + ' ' + url);
		try {
			resp = await browser.runtime.sendNativeMessage(SERVER_NAME, query);
		} catch (err) {
			console.log(`Query error: ${err}`);
			return {};
		}
		console.log(`* Response was ${JSON.stringify(resp)}`);
		if (resp.open) {
			RecentlyRedirectedUrls.add(url, tabId);
		}
		return resp;
	},

	/*
	 * Since onBeforeRequest() cannot handle Firefox's startup tabs,
	 * process those tabs manually on startup.
	 */
	handleStartup: async function() {
		var tabs = await browser.tabs.query({});
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var url = tab.pendingUrl || tab.url;
			console.log(`handleStartup ${url} (tab=${tab.id})`);

			if (!/https?:/.test(url)) {
				console.log("* Ignore non-HTTP/HTTPS URL");
				continue;
			}

			var resp = await Redirector.check(url, tab.id);
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

		// Currently the BrowserSelector Native Messaging Host only supports single
		// request to do two things "browser detection" and "browser kicking" together,
		// thus it is impossible that detect browser by the NMH, check it is recently
		// redirected or not, and don't kick the browser.
		// However, just checking the combination URL and tabId is recently redirected
		// looks safe here. We worry about wrong blocking, but this detection never fail
		// because RecentlyRedirectedUrls.canRedirect() returns false only when the URL
		// is already redirected recently.
		if (!RecentlyRedirectedUrls.canRedirect(details.url, details.tabId)) {
			console.log('Recently redirected: ', url, tabId);
			RecentlyRedirectedUrls.add(details.url, details.tabId);
			return {cancel: true};
		}

		var resp = await Redirector.check(details.url, details.tabId);
		if (resp.open) {
			if (resp.close_tab && Redirector.newTabIds.has(details.tabId)) {
				console.log(`* Close tab#${details.tabId}`);
				browser.tabs.remove(details.tabId);
			}
			return {cancel: true};
		}
	}
};

Redirector.init();
