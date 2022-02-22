"use strict";

/*
 * CONSTANT
 */
var BROWSER = 'chrome';
var SERVER_NAME = 'com.clear_code.browserselector_talk';
var ALARM_MINUTES = 1;
var CANCEL_REQUEST = {redirectUrl:`data:text/html,${escape('<script type="application/javascript">history.back()</script>')}`};

/*
 * A JavaScript port of "wildmat()" by Rich Salz (https://github.com/richsalz/wildmat)
 * Ported by Fujimoto Seiji.
 *
 *  1. `?` represents a single character.
 *  2. `*` represents an arbitrary substring.
 *
 * >>> wildmat("https://www.example.com/", "http*://*.example.com/*")
 * true
 */
function domatch(text, pat, i, j) {
	while (j < pat.length) {
		if (i >= text.length && pat[j] !== '*') {
			return false;
		}

		if (pat[j] === '?') {
			i += 1;
			j += 1;
		} else if (pat[j] === '*') {
			while (pat[j] === '*') {
				/* Consecutive stars act just like one. */
				j += 1;
			}
			if (j >= pat.length) {
				/* Trailing star matches everything. */
				return true;
			}
			while (i < text.length) {
				if (domatch(text, pat, i, j)) {
					return true;
				}
				i += 1;
			}
			return false
		} else {
			if (text[i] !== pat[j]) {
				return false;
			}
			i += 1;
			j += 1;
		}
	}
	return i >= text.length;
}

function wildmat(text, pat) {
	text = text.toLowerCase();
	pat = pat.toLowerCase();
	return domatch(text, pat, 0, 0);
}

var RecentlyRedirectedUrls = {
	entriesByTabId: new Map(),
	timeoutMsec: 100,

	init() {
		chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
			this.entriesByTabId.delete(tabId);
		});
	},

	add(url, tabId) {
		const now = Date.now();

		const urlEntries = this.entriesByTabId.get(tabId) || new Map();
		urlEntries.set(url, now);
		this.entriesByTabId.set(tabId, urlEntries);

		this.setTimeout(() => {
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

/*
 * Observe WebRequests with config fetched from BrowserSelector.
 *
 * A typical configuration looks like this:
 *
 * {
 *	 CloseEmptyTab:1, OnlyMainFrame:1, IgnoreQueryString:1, DefaultBrowser:"firefox",
 *	 URLPattenrs: [
 *		 ['http*://*.example.com/*', 'ie'],
 *		 ...
 *	 ],
 *	 HostNamePattenrs: [
 *		 ['*.example.org/*', 'ie'],
 *	 ]
 * }
 */
var Redirector = {

	init: function() {
		Redirector.cached = null;
		Redirector.newTabIds = new Set();
		RecentlyRedirectedUrls.init();
		Redirector.configure();
		Redirector.listen();
		console.log('Running as BrowserSelector Talk client');
	},

	configure: function() {
		var query = new String('C ' + BROWSER);

		chrome.runtime.sendNativeMessage(SERVER_NAME, query, (resp) => {
			if (chrome.runtime.lastError) {
				console.log('Cannot fetch config', JSON.stringify(chrome.runtime.lastError));
				return;
			}
			var isStartup = (Redirector.cached == null);
			Redirector.cached = resp.config;
			console.log('Fetch config', JSON.stringify(Redirector.cached));

			if (isStartup) {
				Redirector.handleStartup(Redirector.cached);
			}
		});
	},

	listen: function() {
		chrome.webRequest.onBeforeRequest.addListener(
			Redirector.onBeforeRequest,
			{
				urls: ['<all_urls>'],
				types: ['main_frame','sub_frame']
			},
			['blocking']
		);

		/* Refresh config for every N minute */
		console.log('Poll config for every', ALARM_MINUTES , 'minutes');
		chrome.alarms.create("poll-config", {'periodInMinutes': ALARM_MINUTES});

		chrome.alarms.onAlarm.addListener((alarm) => {
			if (alarm.name === "poll-config") {
				Redirector.configure();
			}
		});

		/* Tab book-keeping for intelligent tab handlings */
		chrome.tabs.onCreated.addListener(tab => {
			Redirector.newTabIds.add(tab.id);
		});

		chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
			Redirector.newTabIds.delete(tabId);
		});

		chrome.tabs.onUpdated.addListener((id, info, tab) => {
			if (info.status === 'complete') {
				Redirector.newTabIds.delete(tab.id);
			}
		});

		/*
		 * Edge won't call webRequest.onBeforeRequest() when navigating
		 * from Edge-IE to Edge. Add a workaround via tabs.onUpdated.
		 */
		if (BROWSER === "edge") {
			chrome.tabs.onUpdated.addListener(Redirector.onTabUpdated);
		}
	},

	/*
	 * Request redirection to Native Messaging Hosts.
	 *
	 * * chrome.tabs.get() is to confirm that the URL is originated from
	 *   an actual tab (= not an internal prefetch request).
	 *
	 * * Request Example: "Q edge https://example.com/".
	 */
	redirect: function(url, tabId, closeTab) {
		chrome.tabs.get(tabId, (tab) => {
			if (chrome.runtime.lastError) {
				console.log(`* Ignore prefetch request`);
				return;
			}
			if (!tab) {
				console.log(`* URL is not coming from an actual tab`);
				return;
			}

			if (!RecentlyRedirectedUrls.canRedirect(url, tabId)) {
				console.log('Recently redirected: ', url, tabId);
				RecentlyRedirectedUrls.add(url, tabId);
				if (closeTab) {
					chrome.tabs.remove(tabId);
				}
				return;
			}

			var query = new String('Q ' + BROWSER + ' ' + url);
			chrome.runtime.sendNativeMessage(SERVER_NAME, query, (resp) => {
				RecentlyRedirectedUrls.add(url, tabId);
				if (closeTab) {
					chrome.tabs.remove(tabId);
				}
			});
		});
	},

	/*
	 * Check URL/Host patterns in configuration. Return the matched
	 * browser name, or null if no pattern matched.
	 */
	match: function(config, url) {
		var i;
		var host = url.split('/')[2];
		var URLPatterns = config.URLPatterns
		var HostPatterns = config.HostNamePatterns;

		for (i = 0; i < URLPatterns.length; i++) {
			if (wildmat(url, URLPatterns[i][0])) {
				console.log(`* Match with '${URLPatterns[i][0]}' (browser=${URLPatterns[i][1]})`);
				return URLPatterns[i][1].toLowerCase();
			}
		}

		for (i = 0; i < HostPatterns.length; i++) {
			if (wildmat(host, HostPatterns[i][0])) {
				console.log(`* Match with '${HostPatterns[i][0]}' (browser=${HostPatterns[i][1]})`);
				return HostPatterns[i][1].toLowerCase();
			}
		}
		return null;
	},

	isRedirectURL: function(config, url) {
		if (!url) {
			console.log(`* Empty URL found`);
			return false;
		}

		if (!/^https?:/.test(url)) {
			console.log(`* Ignore non-HTTP/HTTPS URL`);
			return false;
		}

		if (config.IgnoreQueryString) {
			url = url.replace(/\?.*/, '');
		}

		console.log(`* Check ${url} for redirect patterns`);

		var matched = Redirector.match(config, url);
		console.log(`* Result: ${matched}`);

		if (matched !== null) {
			if (matched === BROWSER) {
				return false;
			} else if (matched === '' && config.SecondBrowser === BROWSER) {
				return false;
			} else {
				return true;
			}
		} else {
			console.log(`* Use DefaultBrowser ${config.DefaultBrowser}`);
			if (config.DefaultBrowser === BROWSER) {
				return false;
			} else {
				return true;
			}
		}
	},

	/* Handle startup tabs preceding to onBeforeRequest */
	handleStartup: function(config) {
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				var url = tab.pendingUrl || tab.url;
				console.log(`handleStartup ${url} (tab=${tab.id})`);
				if (Redirector.isRedirectURL(config, url)) {
					console.log(`* Redirect to another browser`);
					Redirector.redirect(url, tab.id, config.CloseEmptyTab);
				}
			});
		});
	},

	onTabUpdated: function(tabId, info, tab) {
		var config = Redirector.cached;
		var url = tab.pendingUrl || tab.url;

		if (info.status !== "loading") {
			return;
		}
		if (!config) {
			return;
		}

		console.log(`onTabUpdated ${url} (tab=${tabId})`);

		if (Redirector.isRedirectURL(config, url)) {
			console.log(`* Redirect to another browser`);
			Redirector.redirect(url, tabId, false);

			/* Call executeScript() to stop the page loading immediately.
			 * Then let the tab go back to the previous page.
			 */
			chrome.tabs.executeScript(tabId, {code: "window.stop()", runAt: "document_start"}, () => {
				chrome.tabs.goBack(tabId);
			});
		}
	},

	/* Callback for webRequest.onBeforeRequest */
	onBeforeRequest: function(details) {
		var config = Redirector.cached;
		var closeTab = false;
		var isMainFrame = (details.type == 'main_frame');

		console.log(`onBeforeRequest ${details.url} (tab=${details.tabId})`);

		if (!config) {
			console.log('* Config cache is empty. Fetching...');
			Redirector.configure();
			return;
		}

		if (details.tabId < 0) {
			console.log(`* Ignore internal request`);
			return;
		}

		if (!isMainFrame) {
			console.log(`* Ignore subframe request`);
			return;
		}

		if (config.CloseEmptyTab && Redirector.newTabIds.has(details.tabId)) {
			closeTab = true;
		}

		if (Redirector.isRedirectURL(config, details.url)) {
			console.log(`* Redirect to another browser`);
			Redirector.redirect(details.url, details.tabId, closeTab);
			return CANCEL_REQUEST;
		}
	}
};

Redirector.init();
