const crypto = require('crypto')
const debug = require('debug')('ilp-cog-koa')
const ILDCP = require('ilp-protocol-ildcp')
const CogListener = require('./listener')

class CogKoa {
  constructor (opts) {
    this.listener = new CogListener(opts)
    this.connected = false
  }

  async _getPskDetails (token) {
    if (!this.connected) {
      debug('connecting listener')
      await this.listener.listen()
      this.connected = true
    }

    const id = Buffer.from(token, 'base64')
    if (id.length !== 16) {
      ctx.throw(400, '`Pay-Token` must be 16 bytes. length=' +
        id.length + ' token=' + token)
      return
    }

    // TODO: only do this once
    debug('generating psk2 params')
    const socket = this.listener.getSocket(id)

    return 'interledger-psk2 ' +
      socket.destinationAccount + ' ' +
      socket.sharedSecret.toString('base64')
  }

  options () {
    return async (ctx, next) => {
      const payToken = ctx.get('Pay-Token')
      if (!payToken) {
        ctx.throw(400, 'must supply `Pay-Token` header.')
        return
      }

      ctx.set('Pay', await this._getPskDetails(payToken))
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
        ctx.set('Pay', await this._getPskDetails(payToken))
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
      try {
        ctx.accountant = await this.listener.getAccountant(id)
      } catch (e) {
        ctx.throw(420, 'accountant already exists for this token. ' +
          'wait for existing command to finish.')
        return
      }

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
