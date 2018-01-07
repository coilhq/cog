const PSK2 = require('ilp-psk2')
const CogAccountant = require('./cog-accountant')
const PluginBtp = require('ilp-plugin-btp')
const debug = require('debug')('ilp-cog-listener')

class CogListener {
  constructor (opts) {
    this.secret = crypto.randomBytes(32)
    // TODO: moneyd
    this.plugin = (opts && opts.plugin) ||
      new PluginBtp('btp+ws://localhost:7768')
    this.accountants = new Map()
  }

  async getAccountant (hexId) {
    let accountant = this.accountants.get(hexId)
    if (!accountant) {
      accountant = new CogAccountant({ plugin: this.plugin })
      this.accountants.set(hexId, accountant)
    }

    return accountant
  }

  async listen (callback) {
    await this.plugin.connect()

    this.stopListening = PSK2.listen(this.plugin, {
      receiverSecret: this.secret
    }, async (params) => {
      const hexId = params.paymentId.toString('hex')

      let accountant = this.accountants.get(hexId)
      if (!accountant) {
        accountant = new CogAccountant({ plugin: this.plugin })
        this.accountants.set(hexId, accountant)

        // fire this off async-style, yo
        // TODO: to where does the result of this computation go
        callback(accountant)
          .catch((e) => {
            debug('error in listen callback. error=', e)
          })
      }

      // TODO: clean up after reject so we don't leak memory (very important
      // because cogs will run for a very long time)
      return accountant.paymentHandler(accountant)
    })
  }
}
