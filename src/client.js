'use strict'

const
  CLIENT_SCOPES = process.env.CLIENT_SCOPES,
  CLIENT_SECRET = process.env.CLIENT_SECRET,
  CLIENT_ID = process.env.CLIENT_ID

const
  debug = require('debug')('slack'),
  qs = require('querystring'),
  axios = require('axios')

const
  client = axios.create({
    baseURL: 'https://slack.com/api',
    headers: { 'User-Agent': 'serverless-slackbot' }
  })


/**
 * OK Check for Responses
 *
 * @param {object} response - The API response to check
 * @return {Promise} A promise with the API response
 */
function getData(response) {
  debug('getData %j', response)

  let data = response.data

  if (data.ok) {
    delete data.ok
    return Promise.resolve(data)
  } else {
    return Promise.reject(data)
  }
}


/**
 * Send data to Slack's API
 *
 * @param {string} endPoint - The method name or url (optional - defaults to chat.postMessage)
 * @param {object} data - The JSON payload to send
 * @return {Promise} A promise with the API response
 */
exports.api = function(endPoint, message) {
  debug('api %s %j', endPoint, message)

  if (!endPoint.match(/^http/i)) {
    // convert the string message to a message object
    if (typeof(message) === 'string')
      message = { text: message }

    // convert json except when passing in a url
    message = qs.stringify(message)
  }

  return client.post(endPoint, message).then(getData)
}


/**
 * Authorize the team
 * 
 * @param {Object} payload - Arguments for the url
 * @return {Promise} A promise with the API response
 */
exports.authorize = function(payload) {
  debug('authorize %j', payload)

  return this.api('oauth.access', {
    code: payload.code,
    state: payload.state,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  })
}


/**
 * Get the authorization url
 * 
 * @param {Object} payload - Arguments for the url
 * @return {String} The payload's response url
 */
exports.getInstallUrl = function(payload) {
  debug('getInstallUrl %j', payload)

  let args = Object.assign({}, payload, {
    client_id: CLIENT_ID,
    scope: CLIENT_SCOPES
  })

  // sends a 301 redirect
  return Promise.resolve(
    'https://slack.com/oauth/authorize?' + qs.stringify(args)
  )
}