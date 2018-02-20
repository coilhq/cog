const request = require('superagent')
const { createSocket } = require('ilp-protocol-paystream')
const PluginBtp = require('ilp-plugin-btp')
const debug = require('debug')('ilp-cog:client')
const crypto = require('crypto')
const { URL } = require('url')

async function call ({
  plugin,
  url,
  method,
  body
}) {
  const id = crypto.randomBytes(16).toString('base64')
  const secret = crypto.randomBytes(16).toString('hex')
  // TODO: moneyd
  const _plugin = plugin || new PluginBtp({
    server: `btp+ws://:${secret}@localhost:7768`
  })

  const prelim = await request
    .options(url)
    .set('Pay-Token', id)
    .send(body)

  const pay = prelim.headers.pay
  const payParams = pay.split(' ')
  if (payParams[0] !== 'interledger-paystream') {
    throw new Error('payment method is not paystream. method=' + payParams[0] +
      ' pay="' + pay + '"')
  }

  await _plugin.connect()

  const senderSocket = await createSocket({
    plugin: _plugin,
    destinationAccount: payParams[1],
    sharedSecret: Buffer.from(payParams[2], 'base64')
  })

  // TODO: max amount to pay
  senderSocket.setMinBalance('-Infinity')
  senderSocket.setMaxBalance('0')

  return request
    [method.toLowerCase()](url)
    .set('Pay-Token', id)
    .set('Stream-Payment', true)
    .send(body)
}

module.exports = {
  call
}
