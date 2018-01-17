const crypto = require('crypto')
const debug = require('debug')('ilp-cog-koa')
const ILDCP = require('ilp-protocol-ildcp')
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

      if (!ctx.get('Stream-Payment')) {
        ctx.set('Pay', await this._getPskDetails())
        ctx.status = 402
        ctx.body = 'must specify Stream-Payment'
        return
      }

      debug('parsing pay-token. token=', payToken)
      const id = Buffer.from(payToken, 'base64')
      if (id.length !== 16) {
        ctx.throw(400, '`Pay-Token` must be 16 bytes. length=' +
          id.length + ' token=' + payToken)
        return
      }

      debug('creating accountant. token=', payToken)
      ctx.accountant = await this.listener.getAccountant(id)

      try {
        await next()
      } catch (e) {
        debug('error in middleware. error=', e) 
        await this.listener.cleanUpAccountant(id)
        ctx.throw(500, 'contract error. error="' + e.message + '"')
        return
      }

      return this.listener.cleanUpAccountant(id)
    }
  }
}

module.exports = CogKoa
