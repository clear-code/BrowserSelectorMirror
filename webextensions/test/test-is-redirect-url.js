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
        if(config.UseRegex) {
          config.URLPatternsMatchers = {};
          config.HostNamePatternsMatchers = {};
          if (config.UseRegex) {
            redirector._generateMatcher(config.URLPatterns, config.URLPatternsMatchers);
            redirector._generateMatcher(config.HostNamePatterns, config.HostNamePatternsMatchers);
          }
        }
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
      describe('URL patterns', () => {
        it(`Match redirect pattern`, () => {
          const url = 'http://www.example.com/';
          const conf = config([['http*://*.example.com/*', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Unmatch redirect pattern`, () => {
          const url = 'http://www.google.com/';
          const conf = config([['http*://*.example.com/*', 'firefox']])
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
        it(`Match redirect pattern with regex: partial match`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['www\.example\.com', 'firefox']], { UseRegex: 1 })
          console.log(conf);
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Match redirect pattern with regex: exact match`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['^www\.example\.com$', 'firefox']], { UseRegex: 1 })
          console.log(conf);
          assert.equal(redirector.isRedirectURL(conf, url), true);
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
      });
    });
  });
});
