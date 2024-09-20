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
        it(`Match redirect pattern`, () => {
          const url = 'http://www.example.com/';
          const conf = config([], [['*.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), true);
        });
        it(`Unmatch redirect pattern`, () => {
          const url = 'http://www.google.com/';
          const conf = config([], [['*.example.com', 'firefox']])
          assert.equal(redirector.isRedirectURL(conf, url), false);
        });
      });
    });
  });
});
