'use strict';

/*
 * CONSTANT
 */
const BROWSER = 'edge';
const SERVER_NAME = 'com.clear_code.browserselector_talk';
const ALARM_MINUTES = 1;
const CANCEL_REQUEST = {
  redirectUrl: `data:text/html,${escape('<script type="application/javascript">history.back()</script>')}`,
};

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

const RecentlyRedirectedUrls = {
  entriesByTabId: new Map(),
  entriesToBeExpired: new Set(),
  timeoutMsec: 10000,
  resumed: false,

  init() {
    this.load();
  },

  save() {
    chrome.storage.session.set({
      recentlyRedirectedUrls: Array.from(
        this.entriesByTabId.entries(),
        ([tabId, urlEntries]) => [tabId, [...urlEntries.entries()]]
      ),
      entriesToBeExpired: [...this.entriesToBeExpired],
    });
  },

  async load() {
    if (this.$promisedLoaded)
      return this.$promisedLoaded;

    console.log(`RecentlyRedirectedUrls: loading previous state`);
    return this.$promisedLoaded = new Promise(async (resolve, _reject) => {
      try {
        const { recentlyRedirectedUrls, entriesToBeExpired } = await chrome.storage.session.get({ recentlyRedirectedUrls: null, entriesToBeExpired: null });
        console.log(`RecentlyRedirectedUrls: loaded recentlyRedirectedUrls, entriesToBeExpired => `, JSON.stringify(recentlyRedirectedUrls), JSON.stringify(entriesToBeExpired));
        this.resumed = !!(recentlyRedirectedUrls || entriesToBeExpired);
        if (recentlyRedirectedUrls) {
          for (const [tabId, entries] of recentlyRedirectedUrls) {
            const urlEntries = this.entriesByTabId.get(tabId) || new Map();
            for (const [url, timestamp] of entries) {
              urlEntries.set(url, timestamp);
            }
            this.entriesByTabId.set(tabId, urlEntries);
          }
        }
        if (entriesToBeExpired) {
          for (const id of entriesToBeExpired) {
            this.entriesToBeExpired.add(id);
          }
        }
      }
      catch(error) {
        console.log('RecentlyRedirectedUrls: failed to load previous state: ', error.name, error.message);
      }
      resolve();
    });
  },

  async add(url, tabId) {
    console.log(`RecentlyRedirectedUrls.add: ${url} (tab=${tabId})`);
    const now = Date.now();
    await this.load();

    // This nested history is designed for better performance to delete
    // obsolete entries when tabs are closed.
    const urlEntries = this.entriesByTabId.get(tabId) || new Map();
    urlEntries.set(url, now);
    this.entriesByTabId.set(tabId, urlEntries);
    this.entriesToBeExpired.add(`${tabId}\n${url}`, now + this.timeoutMsec);
    this.save();
  },

  async delete(url, tabId) {
    console.log(`RecentlyRedirectedUrls.delete: ${url} (tab=${tabId})`);
    await this.load();
    const urlEntries = this.entriesByTabId.get(tabId);
    if (!urlEntries) {
      this.entriesToBeExpired.delete(`${tabId}\n${url}`);
      return;
    }

    urlEntries.delete(url);
    if (urlEntries.size == 0) {
      this.entriesByTabId.delete(tabId);
    }
    this.entriesToBeExpired.delete(`${tabId}\n${url}`);
    this.save();
  },

  canRedirect(url, tabId) {
    console.log(`RecentlyRedirectedUrls.canRedirect: ${url} (tab=${tabId})`);
    try {
      const urlEntries = this.entriesByTabId.get(tabId);
      if (!urlEntries) {
        console.log(' => no URL entry, can redirect');
        return true;
      }

      const now = Date.now();
      const lastAdded = urlEntries.get(url);
      console.log(` => lastAdded = ${lastAdded}`);
      if (lastAdded)
        console.log(` => ${now - lastAdded}msec from lastAdded`);
      if (lastAdded && now - lastAdded < this.timeoutMsec) {
        console.log(` => smaller than ${this.timeoutMsec}, cannot redirect`);
        return false;
      }

      this.delete(url, tabId);
      console.log(' => deleted URL entry, can redirect');
    }
    catch(error) {
      console.log(` => error: ${error}, can redirect`);
    }
    return true;
  },

  async expire() {
    console.log('RecentlyRedirectedUrls: expiring entries');
    const now = Date.now();
    try {
      await this.load();
      for (const id of this.entriesToBeExpired) {
        const [tabId, url] = id.split('\n');
        const urlEntries = this.entriesByTabId.get(tabId);
        if (!urlEntries) {
          console.log(`  tab ${tabId} has no more entry`);
          this.entriesToBeExpired.delete(id);
          continue;
        }
        if (urlEntries.get(url) < now) {
          console.log(`  url ${url} in tab ${tabId} has expired`);
          this.delete(url, tabId);
          continue;
        }
      }
      this.save();
    }
    catch(error) {
      console.log('RecentlyRedirectedUrls: failed to expire: ', error.name, error.message);
    }
  },

  async onTabRemoved(tabId, _removeInfo) {
    await this.load();
    this.entriesByTabId.delete(tabId);
    this.save();
  },
};

RecentlyRedirectedUrls.init();

chrome.tabs.onRemoved.addListener(RecentlyRedirectedUrls.onTabRemoved.bind(RecentlyRedirectedUrls));


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
const Redirector = {
  newWindows: new Map(),
  newWindowTabs: new Map(),
  resumed: false,

  init() {
    this.cached = null;
    this.newTabIds = new Set();
    this.knownTabIds = new Set();
    this.ensureLoadedAndConfigured();
    console.log('Running as BrowserSelector Talk client');
  },

  async ensureLoadedAndConfigured() {
    return Promise.all([
      !this.cached && this.configure(),
      this.load(),
    ]);
  },

  async configure() {
    const query = `C ${BROWSER}`;

    const resp = await chrome.runtime.sendNativeMessage(SERVER_NAME, new String(query));
    if (chrome.runtime.lastError) {
      console.log('Cannot fetch config', JSON.stringify(chrome.runtime.lastError));
      return;
    }
    const isStartup = (this.cached == null);
    this.cached = resp.config;
    console.log('Fetch config', JSON.stringify(this.cached));

    resp.config.URLPatternsMatchers = {};
    resp.config.HostNamePatternsMatchers = {};
    if (resp.config.UseRegex) {
      this._generateMatcher(resp.config.URLPatterns, resp.config.URLPatternsMatchers);
      this._generateMatcher(resp.config.HostNamePatterns, resp.config.HostNamePatternsMatchers);
    }

    if (isStartup && !this.resumed) {
      this.handleStartup(this.cached);
    }
  },
  _generateMatcher(patternsAndBrowsers, matchers) {
    const patternsByBrowser = {};
    for (const patternAndBrowser of patternsAndBrowsers) {
      const [pattern, browser] = patternAndBrowser;
      try {
        new RegExp(pattern);
      }
      catch(_error) {
        console.log('failed to compile a regex pattern: ', pattern, browser);
        continue;
      }
      const safeBrowser = browser.toLowerCase();
      if (!patternsByBrowser[safeBrowser])
        patternsByBrowser[safeBrowser] = [];
      patternsByBrowser[safeBrowser].push(pattern);
    }
    for (const [browser, patterns] of Object.entries(patternsByBrowser)) {
      matchers[browser] = new RegExp(`(${patterns.join('|')})`);
    }
  },

  save() {
    chrome.storage.session.set({
      newWindows: Array.from(
        this.newWindows.entries(),
        ([windowId, tabIds]) => [windowId, [...tabIds]]
      ),
      newWindowTabs: [...this.newWindowTabs.entries()],
      knownTabIds: [...this.knownTabIds],
    });
  },

  async load() {
    if (this.$promisedLoaded)
      return this.$promisedLoaded;

    console.log(`Redirector: loading previous state`);
    return this.$promisedLoaded = new Promise(async (resolve, _reject) => {
      try {
        const { newWindows, newWindowTabs, knownTabIds } = await chrome.storage.session.get({ newWindows: null, newWindowTabs: null, knownTabIds: null });
        console.log(`Redirector: loaded newWindows, newWindowTabs, knownTabIds => `, JSON.stringify(newWindows), JSON.stringify(newWindowTabs), JSON.stringify(knownTabIds));
        this.resumed = !!(newWindows || newWindowTabs || knownTabIds);
        if (newWindows) {
          for (const [windowId, loadedTabIds] of newWindows) {
            if (!loadedTabIds ||
                loadedTabIds.length == 0)
              continue;
            const tabIds = this.newWindows.get(windowId) || new Set();
            for (const tabId of loadedTabIds) {
              tabIds.add(tabId);
            }
            this.newWindows.set(windowId, tabIds);
          }
        }
        if (newWindowTabs) {
          for (const [windowId, tabId] of newWindowTabs) {
            this.newWindowTabs.set(tabId, windowId);
          }
        }
        if (knownTabIds) {
          for (const tabId of knownTabIds) {
            this.knownTabIds.add(tabId);
          }
        }
      }
      catch(error) {
        console.log('Redirector: failed to load previous state: ', error.name, error.message);
      }
      resolve();
    });
  },

  /*
	 * Request redirection to Native Messaging Hosts.
	 *
	 * * chrome.tabs.get() is to confirm that the URL is originated from
	 *   an actual tab (= not an internal prefetch request).
	 *
	 * * Request Example: "Q edge https://example.com/".
	 */
  redirect({ url, tabId, isNewTab, closeEmptyTab }) {
    chrome.tabs.get(tabId, tab => {
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
        if (closeEmptyTab) {
          this.tryCloseEmptyTab({ tab, isNewTab });
        }
        return;
      }

      const query = `Q ${BROWSER} ${url}`;
      RecentlyRedirectedUrls.add(url, tabId);
      chrome.runtime.sendNativeMessage(SERVER_NAME, new String(query), _resp => {
        if (closeEmptyTab) {
          this.tryCloseEmptyTab({ tab, isNewTab });
        }
      });
    });
  },
  tryCloseEmptyTab({ tab, isNewTab }) {
    if (this.newWindows.has(tab.windowId)) {
      const tabIds = this.newWindows.get(tab.windowId);
      this.newWindowTabs.set(tab.id, tab.windowId);
      tabIds.add(tab.id);
      this.newWindows.set(tab.windowId, tabIds);
      this.save();
    }
    chrome.tabs.query({ windowId: tab.windowId }, async tabs => {
      const isNewWindow = this.newWindows.has(tab.windowId);
      const closeTab = isNewTab !== false || isNewWindow;
      console.log(`Trying to close empty tab ${tab.id} (windowId=${tab.windowId}, isNewWindow=${isNewWindow}, closeTab=${closeTab})`);
      if (!closeTab) {
        console.log(` => no close tab`);
        return;
      }
      if (isNewWindow && tabs.length == 1 && tabs[0].id == tab.id) {
        console.log(`Close window ${tab.windowId} due to the redirected last tab`);
        chrome.windows.remove(tab.windowId);
      }
      let existingTab = tab;
      let counter = 0;
      do {
        if (!existingTab)
          break;
        if (counter > 100) {
          console.log(`couldn't close tab ${tab.id} within ${counter} times retry.`);
          break;
        }
        if (counter++ > 0)
          console.log(`tab ${tab.id} still exists: trying to close (${counter})`);
        chrome.tabs.remove(tab.id);
      } while (existingTab = await chrome.tabs.get(tab.id).catch(_error => null));
    });
  },

  /*
	 * Check URL/Host patterns in configuration. Return the matched
	 * browser name, or null if no pattern matched.
	 */
  match(config, url) {
    const host = this._getHost(url);

    if (config.UseRegex) {
      for (const [browser, matcher] of Object.entries(config.URLPatternsMatchers)) {
        if (matcher.test(url)) {
          console.log(`* Match with '${matcher.source}' (browser=${browser})`);
          return browser;
        }
      }

      for (const [browser, matcher] of Object.entries(config.HostNamePatternsMatchers)) {
        if (matcher.test(url)) {
          console.log(`* Match with '${matcher.source}' (browser=${browser})`);
          return browser;
        }
      }
    } else {
      for (const [pattern, browser] of config.URLPatterns) {
        if (wildmat(url, pattern)) {
          console.log(`* Match with '${pattern}' (browser=${browser})`);
          return browser.toLowerCase();
        }
      }

      for (const [pattern, browser] of Object.entries(config.HostNamePatterns)) {
        if (wildmat(host, pattern)) {
          console.log(`* Match with '${pattern}' (browser=${browser})`);
          return browser.toLowerCase();
        }
      }
    }

    return null;
  },
  _getHost(url) {
    try {
      return (new URL(url)).host;
    }
    catch(_error) {
    }
    return '';
  },

  isRedirectURL(config, url) {
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

    const matched = this.match(config, url);
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
  handleStartup(config) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        const url = tab.pendingUrl || tab.url;
        console.log(`handleStartup ${url} (tab=${tab.id})`);
        if (this.isRedirectURL(config, url)) {
          console.log(`* Redirect to another browser`);
          this.redirect({
            url,
            tabId: tab.id,
            closeEmptyTab: config.CloseEmptyTab,
          });
        }
      });
    });
  },

  /* Tab book-keeping for intelligent tab handlings */
  async onTabCreated(tab) {
    await this.ensureLoadedAndConfigured();

    this.newTabIds.add(tab.id);

    const tabIds = this.newWindows.get(tab.windowId);
    if (!tabIds) {
      this.save();
      return;
    }

    tabIds.add(tab.id);
    this.newWindows.set(tab.windowId, tabIds);
    if (tabIds.size > 1)
      this.forgetNewWindow(tab.windowId, 'tabs.onCreated');

    this.save();
  },

  async onTabRemoved(tabId, removeInfo) {
    await this.ensureLoadedAndConfigured();
    this.newTabIds.delete(tabId);
    this.knownTabIds.delete(tabId);
    this.forgetNewWindow(removeInfo.windowId, 'tabs.onRemoved');
    this.save();
  },

  async onTabUpdated(tabId, info, tab) {
    await this.ensureLoadedAndConfigured();

    this.knownTabIds.add(tabId);

    if (info.status === 'complete' ||
        (info.status !== 'loading' && info.url)) {
      this.newTabIds.delete(tabId);
    }

    if (BROWSER !== 'edge') {
      this.save();
      return;
    }
    /*
     * Edge won't call webRequest.onBeforeRequest() when navigating
     * from Edge-IE to Edge, so we need to handle requests on this timing.
     * On such case, info.status is always undefined and only URL changes
     * are notified.
     */

    const config = this.cached;
    const url = tab.pendingUrl || tab.url;

    if (!config) {
      this.save();
      return;
    }

    console.log(`onTabUpdated ${url} (tab=${tabId}, windowId=${tab.windowId}, status=${info.status}/${tab.status})`);

    if (this.newWindows.has(tab.windowId)) {
      this.newWindowTabs.set(tab.id, tab.windowId);
      const tabIds = this.newWindows.get(tab.windowId);
      tabIds.add(tab.id);
      this.newWindows.set(tab.windowId, tabIds);
      this.save();
      console.log(` => initial tab of a new window: skip redirection`);
      return;
    }

    if (this.isRedirectURL(config, url)) {
      console.log(`* Redirect to another browser`);
      this.redirect({
        url,
        tabId,
        closeEmptyTab: this.newWindows.has(tab.windowId),
      });

      /* Call executeScript() to stop the page loading immediately.
       * Then let the tab go back to the previous page.
       */
      chrome.scripting.executeScript({
        target: { tabId },
        func: function goBack(tabId) {
          chrome.tabs.goBack(tabId);
        },
        args: [tabId],
      });
    }
  },

  async onWindowCreated(win) {
    await this.ensureLoadedAndConfigured();
    console.log(`Detected new browser window ${win.id}`);
    this.newWindows.set(win.id, new Set());
    this.save();
  },

  forgetNewWindow(windowId, trigger) {
    console.log(`Forgetting new browser window ${windowId} (trigger=${trigger})`);
    const tabIds = this.newWindows.get(windowId);
    if (tabIds) {
      for (const tabId of tabIds) {
        this.newWindowTabs.delete(tabId);
      }
    }
    this.newWindows.delete(windowId);
    this.save();
  },

  /* Callback for webRequest.onBeforeRequest */
  onBeforeRequest(details) { // this must be sync
    const config = this.cached;
    const isMainFrame = (details.type == 'main_frame');
    const isNewTab = this.newTabIds.has(details.tabId) || !this.knownTabIds.has(details.tabId);
    const isNewWindow = this.newWindowTabs.has(details.tabId);
    const windowId = this.newWindowTabs.get(details.tabId);

    console.log(`onBeforeRequest ${details.url} (tab=${details.tabId}, isNewTab=${isNewTab} isNewWindow=${isNewWindow})`);

    if (!config) {
      console.log('* Config cache is empty. Fetching...');
      this.configure();
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

    if (this.isRedirectURL(config, details.url)) {
      console.log(`* Redirect to another browser`);
      this.redirect({
        url: details.url,
        tabId: details.tabId,
        isNewTab,
        closeEmptyTab: config.CloseEmptyTab,
      });
      return CANCEL_REQUEST;
    }

    this.forgetNewWindow(windowId, 'onBeforeRequest (not redirected)');
  },
};

Redirector.init();

chrome.webRequest.onBeforeRequest.addListener(
  Redirector.onBeforeRequest.bind(Redirector),
  {
    urls: ['<all_urls>'],
    types: ['main_frame','sub_frame']
  },
  ['blocking']
);

chrome.tabs.onCreated.addListener(Redirector.onTabCreated.bind(Redirector));
chrome.tabs.onRemoved.addListener(Redirector.onTabRemoved.bind(Redirector));
chrome.tabs.onUpdated.addListener(Redirector.onTabUpdated.bind(Redirector));
chrome.windows.onCreated.addListener(Redirector.onWindowCreated.bind(Redirector));


/* Refresh config for every N minute */
console.log('Poll config for every', ALARM_MINUTES , 'minutes');
chrome.alarms.create('poll-config', { periodInMinutes: ALARM_MINUTES });

chrome.alarms.create('clear-url-entry', {
  periodInMinutes: RecentlyRedirectedUrls.timeoutMsec / 1000 / 60,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'poll-config':
      Redirector.configure();
      return;

    case 'clear-url-entry':
      RecentlyRedirectedUrls.expire();
      return;
  }
});
