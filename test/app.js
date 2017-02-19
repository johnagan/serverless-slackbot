const assert = require('chai').assert,
  App = require('../src/app'),
  qs = require('querystring')

let app = null

describe('App', () => {

  // Create an instance of an App 
  before(function() {
    app = new App({
      verification_token: process.env.VERIFICATION_TOKEN,
      install_redirect: process.env.INSTALL_REDIRECT,
      client_scopes: process.env.CLIENT_SCOPES,
      client_secret: process.env.CLIENT_SECRET,
      client_id: process.env.CLIENT_ID
    })
  });

  describe('Install Url', () => {
    let install_url = 'https://slack.com/oauth/authorize',
      state = "test",
      code = "abc123",
      test_url = "",
      test_url_parts = [],
      test_url_query = {}

    before(() => {
      app.install({ state }).then(url => {
        test_url = url
        test_url_parts = url.split('?')
        test_url_query = qs.parse(test_url_parts[1])
        test_url_base = test_url_parts[0].toLowerCase()
      })
    })

    it('should contain the correct state ', () => {
      assert.equal(test_url_query.state, state)
    })

    it('should contain the correct base url', () => {
      assert.equal(install_url, test_url_base)
    })

    it('should contain the correct client_id ', () => {
      assert.equal(test_url_query.client_id, process.env.CLIENT_ID)
    })

    // it('should contain the correct client_secret ', () => {
    //   assert.equal(test_url_query.client_secret, process.env.CLIENT_SECRET)
    // })

    it('should contain the correct scope ', () => {
      assert.equal(test_url_query.scope, process.env.CLIENT_SCOPES)
    })
  })

})