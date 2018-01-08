const crypto = require('crypto')
const debug = require('debug')('ilp-cog-koa')
const ILDCP = require('ilp-protocol-ildcp')
const PSK2 = require('ilp-psk2')
const CogListener = require('./listener')

class CogKoa {
  constructor (opts) {
    this.listener = new CogListener(opts)
    this.connected = false
  }

  async _getPskDetails () {
    if (!this.connected) {
      debug('connecting listener')
      await this.listener.listen()
      this.connected = true
    }

    // TODO: only do this once
    debug('generating psk2 params')
    const params = this.listener.getPskDetails()

    return 'interledger-psk2 ' +
      params.destinationAccount + ' ' +
      params.sharedSecret.toString('base64')
  }

  options () {
    return async (ctx, next) => {
      ctx.set('Pay', await this._getPskDetails())
      return next()
    }
  }

  paid () {
    return async (ctx, next) => {
      const payToken = ctx.get('Pay-Token')
      if (!payToken) {
        ctx.throw(400, 'must supply `Pay-Token` header.')
        return
      }

      debug('parsing pay-token. token=', payToken)
      const id = Buffer.from(payToken, 'base64')
      if (id.length !== 16) {
        ctx.throw(400, '`Pay-Token` must be 16 bytes. length=' +
          id.length + ' token=' + payToken)
      }

      debug('creating accountant. token=', payToken)
      ctx.accountant = this.listener.getAccountant(id)
      return next()
    }
  }
}

module.exports = CogKoa
