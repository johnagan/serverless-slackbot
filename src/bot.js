'use strict'

const
  debug = require('debug')('bot'),
  EventEmitter = require('events'),
  client = require('./client'),
  aws = require('./aws')


class Bot extends EventEmitter {

  /**
   * Constructor
   *
   * @param {object} store - The team's store
   */
  constructor(store) {
    debug('constructor:store %j', store)
    super()
    this.store = store || {}
  }


  /**
   * Brain getter
   *
   * @return {Object} the bot's brain
   */
  get brain() {
    debug('brain:get %j', this.store.brain)
    return this.store.brain || {}
  }


  /**
   * Brain setter
   *
   * @param {object} brain - the brain to set
   */
  set brain(brain) {
    debug('brain:set %j', brain)
    this.store.brain = brain
  }


  /**
   * Access Info
   *
   * @return {String} the current team id
   */
  get auth() {
    debug('auth %j', this.store.auth)
    return this.store.auth
  }


  /**
   * Team Id
   *
   * @return {String} the current team id
   */
  get team_id() {
    debug('token %j', this.auth)
    return this.auth.team_id
  }


  /**
   * API Token
   * 
   * @return {String} the team's API token
   */
  get token() {
    debug('token %j', this.auth)
    if (this.auth.bot) return this.auth.bot.bot_access_token
    else return this.auth.access_token
  }


  /**
   * Channel
   *
   * @param {object} payload - The message payload
   * @return {String} the payload's channel
   */
  getChannel(payload) {
    debug('getChannel %j', payload)
    let event = payload.event

    // Interactive Messages
    if (payload.channel) return payload.channel.id

    // Slash Commands
    if (payload.channel_id) return payload.channel_id

    // Events API
    if (event && event.channel) return event.channel
    if (event && event.item) return event.item.channel
  }


  /**
   * Send Reply
   *
   * @param {object} payload - The original message payload
   * @param {object} message - The message to reply with
   * @param {boolean} ephemeral - Flag to make the message ephemeral
   * @return {Promise} A promise with the API response
   */
  reply(payload, message, ephemeral) {
    debug('reply:payload %j', payload)
    debug('reply:message %j', message)
    debug('reply:ephemeral', ephemeral)

    let channel = this.getChannel(payload)

    // convert the string message to a message object
    if (typeof(message) === 'string') message = { text: message }

    // invalid ephemeral requests
    if (!payload.response_url && ephemeral)
      return Promise.reject("Message can't be private")

    // slash commands and interactive messages
    if (payload.response_url) {
      if (!ephemeral && !message.response_type) message.response_type = 'in_channel'
      return client.api(payload.response_url, message)
    }

    // incoming webhooks
    if (this.auth.incoming_webhook && !channel && !message.channel)
      return client.api(this.auth.incoming_webhook.url, message)

    // fallback
    return this.say(message)
  }


  /**
   * Send Private Reply
   *
   * @param {object} payload - The original message payload
   * @param {object} message - The message to reply with
   * @return {Promise} A promise with the API response
   */
  replyPrivate(payload, message) {
    debug('replyPrivate:payload %j', payload)
    debug('replyPrivate:message %j', message)
    return this.reply(payload, message, true)
  }


  /**
   * Send Message
   *
   * @param {object} message - The message to post
   * @return {Promise} A promise with the API result
   */
  say(message) {
    debug('say %j', message)
    return client.api('chat.postMessage', message)
  }


  /**
   * Send data to Slack's API
   *
   * @param {string} endPoint - The method name or url (optional - defaults to chat.postMessage)
   * @param {object} data - The JSON payload to send
   * @return {Promise} A promise with the API response
   */
  send(endPoint, data) {
    debug('send %j', message)
    return client.api(endPoint, message)
  }


  /**
   * Event handler for incoming messages
   *
   * @param {mixed} args - Any number of event names to listen to. The last will be the callback
   * @return {Promise} A promise with callback results 
   */
  on(names) {
    debug('on', arguments)

    let callback = null
    let args = Array.prototype.slice.call(arguments)
    let len = args.length

    // determine if a callback was passed in
    if (len > 1 && typeof(args[len - 1]) === "function")
      callback = args.pop()

    return new Promise(resolve => {
      if (!callback) callback = resolve
      args.forEach(name => super.on(name, callback))
    })
  }


  /**
   * Listen for specific message text
   *
   * @param {RegExp} regex - The RegEx of what to match
   * @param {Function} callback - The callback to run when matched
   * @return {Promise} A promise with callback results
   */
  hears(regex, callback) {
    debug('hears', regex)

    return this.on('*', (payload, bot) => {
      debug('hears:payload %j', payload)
      let match = null

      // slash commands
      if (payload.text)
        match = payload.text.match(regex)

      // events
      if (payload.event && payload.event.text)
        match = payload.event.text.match(regex)

      return new Promise(resolve => {
        debug('hears:match', match)
        if (!callback) callback = resolve
        if (match) callback(payload, bot, match)
      })
    })
  }


  /**
   * Dispatch to listeners
   *
   * @param {Object} payload - The payload
   * @return {Promise} A promise with the events that were notified
   */
  dispatch(payload) {
    debug('dispatch %j', payload)

    // ignore bots
    if (payload.bot_id || (payload.event && payload.event.bot_id)) return

    let events = ['*']

    // notify incoming message by type
    if (payload.type) events.push(payload.type)

    // notify event triggered by event type
    if (payload.event) events.push('event', payload.event.type)

    // notify slash command by command
    if (payload.command) events.push('slash_command', payload.command)

    // notify webhook triggered by trigger word
    if (payload.trigger_word) events.push('webhook', payload.trigger_word)

    // notify message button triggered by callback_id
    if (payload.callback_id) events.push('interactive_message', payload.callback_id)

    events.forEach(name => this.emit(name, payload, this))
  }
}


module.exports = Bot