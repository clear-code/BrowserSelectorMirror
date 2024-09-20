'use strict';

/*
 * CONSTANT
 */
const BROWSER = 'chrome';
const SERVER_NAME = 'com.clear_code.browserselector_talk';
const ALARM_MINUTES = 0.5; // require Chromium 120 and later
const CANCEL_REQUEST = {
  redirectUrl: `data:text/html,${escape('<script type="application/javascript">history.back()</script>')}`,
};
const REDIRECT_INTERVAL_LIMIT = 1000;

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


/*
 * Observe WebRequests with config fetched from BrowserSelector.
 *
 * A typical configuration looks like this:
 *
 * {
 *	 DefaultBrowser: "firefox",
 *	 SecondBrowser: "",
 *	 FirefoxCommand: "",
 *	 CloseEmptyTab: 1,
 *	 OnlyOnAnchorClick: 0,
 *	 UseRegex: 0,
 *	 URLPattenrs: [
 *		 ['http*://*.example.com/*', 'ie'],
 *		 ...
 *	 ],
 *	 HostNamePattenrs: [
 *		 ['*.example.org/*', 'ie'],
 *	 ],
 *	 ZonePatterns: []
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
    this.recentRequests = new Map();
    this.lastUrl = new Map();
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
  async redirect({ url, tabId, windowId, isNewTab, closeEmptyTab }) {
    let redirected = false;

    if (chrome.runtime.lastError) {
      console.log(`* Ignore prefetch request`);
      return redirected;
    }
    if (tabId <= 0) {
      console.log(`* URL is not coming from an actual tab`);
      return redirected;
    }

    if (this.checkRedirectIntervalLimit(tabId, url)) {
      console.log('Recently redirected: ', url, tabId);
    }
    else {
      const query = `Q ${BROWSER} ${url}`;
      await chrome.runtime.sendNativeMessage(SERVER_NAME, new String(query));
      redirected = true;
    }

    if (closeEmptyTab) {
      await this.tryCloseEmptyTab({ tabId, windowId, isNewTab });
    }
    return redirected;
  },
  async tryCloseEmptyTab({ tabId, windowId, isNewTab }) {
    if (!windowId)
      windowId = (await chrome.tabs.get(tabId)).windowId;

    if (this.newWindows.has(windowId)) {
      const tabIds = this.newWindows.get(windowId);
      this.newWindowTabs.set(tabId, windowId);
      tabIds.add(tabId);
      this.newWindows.set(windowId, tabIds);
      this.save();
    }

    const tabs = await chrome.tabs.query({ windowId });
    const isNewWindow = this.newWindows.has(windowId);
    const closeTab = isNewTab !== false || isNewWindow;
    console.log(`Trying to close empty tab ${tabId} (windowId=${windowId}, isNewWindow=${isNewWindow}, closeTab=${closeTab})`);
    if (!closeTab) {
      console.log(` => no close tab`);
      return;
    }
    if (isNewWindow && tabs.length == 1 && tabs[0].id == tabId) {
      console.log(`Close window ${windowId} due to the redirected last tab`);
      chrome.windows.remove(windowId);
    }
    let existingTab;
    let counter = 0;
    while (existingTab = await chrome.tabs.get(tabId).catch(_error => null)) {
      if (counter > 100) {
        console.log(`couldn't close tab ${tabId} within ${counter} times retry.`);
        break;
      }
      if (counter++ > 0)
        console.log(`tab ${tabId} still exists: trying to close (${counter})`);
      await chrome.tabs.remove(tabId);
    }
  },

  checkRedirectIntervalLimit(tabId, url) {
    const now = Date.now();
    let skip = false;
    if (!this.recentRequests) {
      // in unit test
      return false;
    }
    for (const [key, entry] of this.recentRequests.entries()) {
      if (Math.abs(now - entry.time) > REDIRECT_INTERVAL_LIMIT)
        this.recentRequests.delete(key);
    }
    const recent = this.recentRequests.get(tabId);
    if (recent && recent.url === url) {
      skip = true;
    }
    this.recentRequests.set(tabId, { tabId: tabId, url: url, time: now });
    return skip;
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

      for (const [pattern, browser] of config.HostNamePatterns) {
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
            windowId: tab.windowId,
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
    const lastUrls = this.lastUrl.get(removeInfo.windowId);
    if (lastUrls) {
      lastUrls.delete(tabId);
    }
    this.forgetNewWindow(removeInfo.windowId, 'tabs.onRemoved');
    this.save();
  },

  async onTabUpdated(tabId, info, tab) {
    await this.ensureLoadedAndConfigured();

    this.knownTabIds.add(tabId);
    this.newTabIds.delete(tabId);

    const config = this.cached;
    const url = tab.pendingUrl || tab.url;

    if (!config) {
      this.save();
      return;
    }

    console.log(`onTabUpdated ${url} (tab=${tabId}, windowId=${tab.windowId}, status=${info.status}/${tab.status}) `, JSON.stringify(info));

    if (info.status !== 'loading' &&
        info.status !== undefined /* IE Mode tab on Edge will have undefined status */)
      return;

    const lastUrl = this.getLastUrl(tab);
    if (tab.url == lastUrl)
      return;

    this.saveLastUrl(tab);

    if (this.newWindows.has(tab.windowId)) {
      this.newWindowTabs.set(tab.id, tab.windowId);
      const tabIds = this.newWindows.get(tab.windowId);
      tabIds.add(tab.id);
      this.newWindows.set(tab.windowId, tabIds);
      this.save();
      console.log(` => initial tab of a new window: skip redirection`);
      return;
    }

    // If onBeforeRequest() fails to redirect due to missing config, the next chance to do it is here.
    if (!this.isRedirectURL(config, url))
      return;

    console.log(`* Redirect to another browser`);
    const redirected = await this.redirect({
      url,
      tabId,
      windowId: tab.windowId,
      closeEmptyTab: this.newWindows.has(tab.windowId),
    });
    if (!redirected) {
      return;
    }

    /* Call executeScript() to stop the page loading immediately.
     * Then let the tab go back to the previous page.
     */
    chrome.scripting.executeScript({
      target: { tabId },
      func: function goBack() {
        window.history.back();
      },
    });
  },

  getLastUrl(tab) {
    const lastUrls = this.lastUrl.get(tab.windowId);
    return lastUrls && lastUrls.get(tab.id);
  },

  saveLastUrl(tab) {
    const lastUrls = this.lastUrl.get(tab.windowId) || new Map();
    lastUrls.set(tab.id, tab.url);
    this.lastUrl.set(tab.windowId, lastUrls);
  },

  async onWindowCreated(win) {
    await this.ensureLoadedAndConfigured();
    console.log(`Detected new browser window ${win.id}`);
    this.newWindows.set(win.id, new Set());
    this.save();
  },

  async onWindowRemoved(win) {
    await this.ensureLoadedAndConfigured();
    this.lastUrl.delete(win.id)
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

    if (details.documentLifecycle == 'prerender') {
      console.log(`* Ignore prefetching request`);
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
chrome.windows.onRemoved.addListener(Redirector.onWindowRemoved.bind(Redirector));


/* Refresh config for every N minute */
console.log('Poll config for every', ALARM_MINUTES , 'minutes');
chrome.alarms.create('poll-config', { periodInMinutes: ALARM_MINUTES });

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'poll-config':
      Redirector.configure();
      return;
  }
});
