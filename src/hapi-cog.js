const CogListener = require('./listener')
const debug = require('debug')('ilp-cog-hapi')
const Boom = require('boom')

const plugin = {}

plugin.register = async (server, options, next) {
  debug('connecting listener')
  const listener = new CogListener(options)
  await listener.listen()

  function getDetails (id) {
    debug('generating stream params. id=' + id.toString('hex'))
    const params = listener.getDetails(id)
    return 'interledger-stream ' +
      params.destinationAccount + ' ' +
      params.sharedSecret.toString('base64')
  }

  server.decorate('request', 'ilpStream', function () {
    const payToken = this.headers['pay-token']
    if (!payToken) {
      throw new Boom.badRequest('must supply `Pay-Token` header.')
    }

    const id = Buffer.from(payToken, 'base64')
    if (id.length !== 16) {
      throw new Boom.badRequest('`Pay-Token` must be 16 bytes base64.')
    }

    const stream = listener.getStream(id)
    if (!stream) {
      const error = new Boom.paymentRequired()
      error.output.headers['Pay'] = getDetails(id)
      throw error
    }

    // TODO: clean up stream when request is over
    debug('got stream. id=', id.toString('hex'))
    return stream
  })
}

plugin.pkg = require('./package.json')

module.exports = {
  plugin,
  options: {}
}
