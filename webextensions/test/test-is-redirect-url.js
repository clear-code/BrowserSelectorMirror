const assert = require('assert');
const chromestub = require('./chrome-stub.js');

describe('isRedirectURL', () => {
  const redirectors = [
    { browser: 'chrome', module: require('../testee/chrome.js') },
    { browser: 'edge',   module: require('../testee/edge.js')   },
  ].forEach(({browser, module}) => {
    const redirector = module.redirector;
    describe(browser, () => {
      const baseConfig = {
        DefaultBrowser: browser,
        SecondBrowser: "",
        FirefoxCommannd: "",
        CloseEmptyTab: 1,
        OnlyOnAnchorClick: 0,
        UseRegex: 0,
        URLPatterns: [],
        HostNamePatterns: [],
        ZonePatterns: [],
      }
      function config(URLPatterns = [], HostNamePatterns = [], additionals = {}) {
        const config = {...baseConfig, ...additionals};
        config.URLPatterns = [...config.URLPatterns, ...URLPatterns];
        config.HostNamePatterns = [...config.HostNamePatterns, ...HostNamePatterns];
        return config;
      }
      describe('Empty redirect pattern', () => {
        it(`Should not redirect when default browser is ${browser}`, () => {
          const url = 'http://www.google.com/';
          assert.equal(redirector.isRedirectURL(baseConfig, url), false);
        });
        it(`Should redirect when default browser is not ${browser}`, () => {
          const defaultBrowser = browser === 'edge' ? 'chrome' : 'edge';
          const url = 'http://www.google.com/';
          assert.equal(redirector.isRedirectURL(config([], [], {DefaultBrowser: defaultBrowser}), url), true);
        });
      });
      it(`Match redirect pattern with regex: partial match`, () => {
        const url = 'http://www.example.com/';
        const conf = config([['http://www\.example\.com/', 'firefox']], [], { UseRegex: 1 })
        assert.equal(redirector.isRedirectURL(conf, url), true);
      });
      it(`Match redirect pattern with regex: exact match`, () => {
        const url = 'http://www.example.com/';
        const conf = config([['^http://www\.example\.com/$', 'firefox']], [], { UseRegex: 1 })
        assert.equal(redirector.isRedirectURL(conf, url), true);
      });
      describe('URL patterns', () => {
        it(`Match redirect pattern with wild card`, () => {
          const url = 'http://www.example.com/';
          const conf = config([['http*://*.example.com/*', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern: redirection (matches firefox)`, () => {
          const url = 'http://www.example.com/';
          const conf = config(
            [
              ['not-match', browser],
              ['http*://*.example.com/*', 'firefox'],
              ['http*://*.example.com/*', browser]
            ])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern: non redirection (matches myself)`, () => {
          const url = 'http://www.example.com/';
          const conf = config(
            [
              ['not-match', browser],
              ['http*://*.example.com/*', browser],
              ['http*://*.example.com/*', 'firefox']
            ])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Match first pattern with regex: redirection (matches firefox)`, () => {
          // On 2.2.0 or before, patterns were grouped by browser, so they were matched in 
          // the order in which the browsers appeared, rather than in top-down order of the patterns.
          // On the versions later than 2.2.0, the patterns were matched in the order in top-down order.
          const url = 'http://www.example.com/';
          const conf = config(
            [
              // We need this to make the "browser" the first appeared browser.
              ['not-match', browser],
              ['http://www\.example\.com/.*', 'firefox'],
              ['http://www\.example\.com/.*', browser]
            ],
            [],
            { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern with regex: non redirection (matches myself)`, () => {
          // On 2.2.0 or before, patterns were grouped by browser, so they were matched in 
          // the order in which the browsers appeared, rather than in top-down order of the patterns.
          // On the versions later than 2.2.0, the patterns were matched in the order in top-down order.
          const url = 'http://www.example.com/';
          const conf = config(
            [
              // We need this to make the "browser" the first appeared browser.
              ['not-match', browser],
              ['http://www\.example\.com/.*', browser],
              ['http://www\.example\.com/.*', 'firefox']
            ],
            [],
            { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern with wild card`, () => {
          const url = 'http://www.google.com/';
          const conf = config([['http*://*.example.com/*', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern with regex`, () => {
          const url = 'http://www.google.com/';
          const conf = config([['http://www\.example\.com/', 'firefox']], [], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
      });
      describe('HostName patterns', () => {
        it(`Match redirect pattern without wildcard`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['www.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match redirect pattern with wildcard`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['*.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match redirect pattern with regex`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['www\.example\.com', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match redirect pattern with regex: extra caret and dollar`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['^www\.example\.com$', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match redirect pattern with regex: partial match`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['.*\.example\..*', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern: redirection (matches firefox)`, () => {
          const url = 'http://www.example.com/';
          const conf = config(
            [],
            [
              ['not-match', browser],
              ['www\.example\.com', 'firefox'],
              ['www\.example\.com', browser]
            ])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern: non redirection (matches myself)`, () => {
          const url = 'http://www.example.com/';
          const conf = config(
            [],
            [
              ['not-match', browser],
              ['www\.example\.com', browser],
              ['www\.example\.com', 'firefox']
            ])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Match first pattern with regex: redirection (matches firefox)`, () => {
          // On 2.2.0 or before, patterns were grouped by browser, so they were matched in 
          // the order in which the browsers appeared, rather than in top-down order of the patterns.
          // On the versions later than 2.2.0, the patterns were matched in the order in top-down order.
          const url = 'http://www.example.com/';
          const conf = config(
            [],
            [
              // We need this to make the "browser" the first appeared browser.
              ['not-match', browser],
              ['www\.example\.com', 'firefox'],
              ['www\.example\.com', browser]
            ],
            { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match first pattern with regex: non redirection (matches myself)`, () => {
          // On 2.2.0 or before, patterns were grouped by browser, so they were matched in 
          // the order in which the browsers appeared, rather than in top-down order of the patterns.
          // On the versions later than 2.2.0, the patterns were matched in the order in top-down order.
          const url = 'http://www.example.com/';
          const conf = config(
            [],
            [
              // We need this to make the "browser" the first appeared browser.
              ['not-match', browser],
              ['www\.example\.com', browser],
              ['www\.example\.com', 'firefox']
            ],
            { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern without wildcard`, () => {
          const url = 'http://www.google.com/';
          const conf = config([], [['www.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern extra scheme`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['http://www.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern with wildcard`, () => {
          const url = 'http://www.google.com/';
          const conf = config([], [['*.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern with regex`, () => {
          const url = 'http://www.google.com/';
          const conf = config([], [['www\.example\.com', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern extra scheme with regex`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['http://www.example.com', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
        it(`Unmatch redirect pattern with regex: not exact match`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['\.example\.', 'firefox']], { UseRegex: 1 })
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
      });
    });
  });
});
