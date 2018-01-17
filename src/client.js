const request = require('superagent')
const { sendSingleChunk } = require('ilp-protocol-psk2')
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
  const secret = crypto.randomBytes(16).toString('hex')
  // TODO: moneyd
  const _plugin = plugin || new PluginBtp({
    server: `btp+ws://:${secret}@localhost:7768`
  })

  const prelim = await request
    .options(url)
    .send(body)

  const pay = prelim.headers.pay
  const payParams = pay.split(' ')
  if (payParams[0] !== 'interledger-psk2') {
    throw new Error('payment method is not psk2. method=' + payParams[0] +
      ' pay="' + pay + '"')
  }

  const id = crypto.randomBytes(16)
  const senderParams = {
    id,
    sourceAmount: 200,
    destinationAccount: payParams[1],
    sharedSecret: Buffer.from(payParams[2], 'base64'),
    sequence: 0,
    minDestinationAmount: 0,
    lastChunk: false
  }

  await _plugin.connect()

  let requestComplete = false
  const requestPromise = request
    [method.toLowerCase()](url)
    .set('Pay-Token', id.toString('base64'))
    .set('Stream-Payment', true)
    .send(body)
    .then((response) => {
      requestComplete = true
      return response
    })
    .catch((e) => {
      requestComplete = true
      throw e
    })

  while (!requestComplete) {
    // TODO: controls on speed and total amount?
    try {
      await sendSingleChunk(_plugin, senderParams)
    } catch (e) {
      debug('chunk rejected:', e)
      break // TODO: break or keep trying until response?
    }
    senderParams.sequence ++
  }

  return requestPromise
}

module.exports = {
  call
}
