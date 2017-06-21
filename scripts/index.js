'use strict'
/**
 * Sample Script
 */
module.exports = bot => {

  // responds to any slash command
  bot.on('slash_command', payload => {
    let payloadMsg = '```' + JSON.stringify(payload, null, 4) + '```'

    bot.reply(payload, {
      text: payloadMsg
    })
  })


  // responds to "johnagan" in a text
  bot.hears(/johnagan/, (payload, bot, match) => {
    let payloadMsg = '```' + JSON.stringify(payload, null, 4) + '```'

    bot.reply(payload, {
      text: payloadMsg
    })
  })

}
