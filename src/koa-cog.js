const crypto = require('crypto')
const debug = require('debug')('ilp-cog-koa')

class CogKoa {
  constructor (opts) {
    // this.secret = crypto.randomBytes(32)
    // TODO: moneyd
    // this.plugin = opts && opts.plugin
  }

  _getPskDetails () {
    // TODO: for real
    return 'interledger-ksk2 VwdiSrgYRZBtDct7YsZVfm476Q_JFsgmmLlMBLAj5E8'
  }

  options () {
    return async (ctx, next) => {
      ctx.set('Pay', this._getPskDetails())
      return next()
    } 
  }

  paid () {
    return async (ctx, next) => {
      const paymentId = ctx.get('Pay-Token')
      if (!paymentId) {
        ctx.throw(400, 'must supply `Pay-Token` header.')
        return
      }

      ctx.accountant = {
        getValue: async (v) => {
          return new Promise((resolve) => setTimeout(resolve.bind(null, v), 100))
        }
      } // this.listener.getAccountant(id)

      debug('next')
      return next()
    }
  }
}

module.exports = CogKoa
