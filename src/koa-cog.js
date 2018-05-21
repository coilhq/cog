const crypto = require('crypto')
const debug = require('debug')('ilp-cog-koa')
const ILDCP = require('ilp-protocol-ildcp')
const CogListener = require('./listener')

class CogKoa {
  constructor (opts) {
    this.listener = new CogListener(opts)
    this.connected = false
  }

  async _getDetails (id) {
    if (!this.connected) {
      debug('connecting listener')
      await this.listener.listen()
      this.connected = true
    }

    // TODO: only do this once
    debug('generating stream params. id=' + id)
    const params = this.listener.getDetails(id)

    return 'interledger-stream ' +
      params.destinationAccount + ' ' +
      params.sharedSecret.toString('base64')
  }

  /* TODO: use this?
  options () {
    return async (ctx, next) => {
      const payToken = ctx.get('Pay-Token')
      if (!payToken) {
        ctx.throw(400, 'must supply `Pay-Token` header.')
        return
      }

      if (Buffer.from(payToken, 'base64').length !== 16) {
        ctx.throw(400, '`Pay-Token` must be 16 bytes of base64.')
        return
      }

      ctx.set('Pay', await this._getDetails(payToken))
      return next()
    }
  }*/

  paid () {
    return async (ctx, next) => {
      const payToken = ctx.get('Pay-Token')
      if (!payToken) {
        ctx.throw(400, 'must supply `Pay-Token` header.')
        return
      }

      const id = Buffer.from(payToken, 'base64')
      if (id.length !== 16) {
        ctx.throw(400, '`Pay-Token` must be 16 bytes of base64.')
        return
      }

      const stream = this.listener.getStream(id)
      if (!stream) {
        ctx.set('Pay', await this._getDetails(id))
        ctx.status = 402
        return
      }

      debug('got stream. id=', id)
      ctx.ilpStream = stream

      try {
        await next()
      } catch (e) {
        debug('error in middleware. error=', e)
        await this.listener.cleanUpStream(id)
        ctx.throw(500, 'contract error. error="' + e.message + '"')
        return
      }

      return this.listener.cleanUpStream(id)
    }
  }
}

module.exports = CogKoa
