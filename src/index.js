'use strict'

const
  INSTALL_REDIRECT = process.env.INSTALL_REDIRECT,
  VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN

const
  debug = require('debug')('index'),
  client = require('./client'),
  qs = require('querystring'),
  aws = require('./aws'),
  Bot = require('./bot')


/**
 * Lambda handler
 *
 * @param {Object} event - The Lambda event
 * @param {Object} context - The Lambda context
 * @param {Function} callback - The Lambda callback
 */
exports.handler = function(event, context, callback) {
  debug('handler:event %j', event)
  debug('handler:context %j', context)

  if (event.method === "GET") install(event.query || {}, context)
  if (event.method === "POST") receive(event.body || {}, context)
  if (event.Records) execute(JSON.parse(event.Records[0].Sns.Message), context)
}


/**
 * Install handler
 *
 * @param {Object} payload - The event payload
 * @param {Object} context - The Lambda context
 */
function install(payload, context) {
  debug('install:payload %j', payload)
  debug('install:context %j', context)

  // redirect to Slack's OAuth flow
  if (!payload.code)
    client.getInstallUrl(payload).then(context.fail)

  // prepare redirect querystring
  let query = {}
  if (payload.state) query.state = payload.state

  // redirect handlers
  let error = e => query.error = e.error
  let redirect = () => context.fail(`${INSTALL_REDIRECT}?${qs.stringify(query)}`)

  client.authorize(payload).then(aws.save).catch(error).then(redirect)
}


/**
 * Receive handler
 *
 * @param {Object} payload - The event payload
 * @param {Object} context - The Lambda context
 */
function receive(payload, context) {
  debug('receive:payload %j', payload)
  debug('receive:context %j', context)

  let team_id = payload.team_id

  // Interactive Messages
  if (payload.payload) {
    payload = JSON.parse(payload.payload)
    team_id = payload.team.id
  }

  // Verification Token
  if (payload.token && payload.token !== VERIFICATION_TOKEN)
    return context.fail("[401] Unauthorized")

  // Events API challenge
  if (payload.challenge)
    return context.succeed(payload.challenge)

  // Create SNS notification
  let notify = store => {
    let scripts = require('../scripts.json')
    let notifications = scripts.map(script => aws.notify({ script, store, payload }))
    return Promise.all(notifications)
  }

  // Create an error message
  let fail = error => {
    context.fail('```' + JSON.stringify(error, null, 4) + '```')
  }

  return aws.get(team_id).then(notify).catch(fail)
}


/**
 * Execute from SNS handler
 *
 * @param {Object} payload - The event payload
 * @param {Object} context - The Lambda context
 */
function execute(event, context) {
  debug('execute:event %j', event)
  debug('execute:context %j', context)

  let bot = new Bot(event.store)
  require(event.script)(bot)
  bot.dispatch(event.payload)
}