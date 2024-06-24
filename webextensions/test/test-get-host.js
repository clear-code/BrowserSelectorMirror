const assert = require('assert');
const chromestub = require('./chrome-stub.js');

describe('getHost', () => {
  const redirectors = [
    { browser: 'chrome', module: require('../testee/chrome.js') },
    { browser: 'edge',   module: require('../testee/edge.js')   },
  ].forEach(({browser, module}) => {
    describe(browser, () => {
      const redirector = module.redirector;
      it('http: extract host name', () => {
        const url = 'http://www.google.com/';
        assert.equal(redirector._getHost(url), 'www.google.com');
      });
      it('https: extract host name', () => {
        const url = 'https://www.google.com/';
        assert.equal(redirector._getHost(url), 'www.google.com');
      });
      it('exclude account', () => {
        const url = 'https://foobar:password@www.google.com/';
        assert.equal(redirector._getHost(url), 'www.google.com');
      });
      // TODO:
      // Although C++ implementation intends to exclude port number, JavaScript
      // one includes it. So that this test always fails with current code.
      // We may need to fix it.
      /*
      it('exclude port number', () => {
        const url = 'https://www.google.com:8080/';
        assert.equal(redirector._getHost(url), 'www.google.com');
      });
      */
    });
  });
});
