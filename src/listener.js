const PSK2 = require('ilp-psk2')
const crypto = require('crypto')
const CogAccountant = require('./cog-accountant')
const PluginBtp = require('ilp-plugin-btp')
const debug = require('debug')('ilp-cog-listener')

class CogListener {
  constructor (opts) {
    this.secret = crypto.randomBytes(32)
    // TODO: moneyd
    const secret = crypto.randomBytes(16).toString('hex')
    this.plugin = (opts && opts.plugin) ||
      new PluginBtp({ server: `btp+ws://:${secret}@localhost:7768` })
    this.accountants = new Map()
    this.receiver = new PSK2.Receiver(this.plugin, this.secret)
  }

  async getAccountant (id) {
    const hexId = id.toString('hex')
    let accountant = this.accountants.get(hexId)
    if (!accountant) {
      accountant = new CogAccountant({ plugin: this.plugin })
      this.accountants.set(hexId, accountant)
    }

    debug('returning accountant for', id)
    return accountant
  }

  async cleanUpAccountant (id) {
    // TODO
  }

  getPskDetails () {
    return this.receiver.generateAddressAndSecret()
  }

  async listen (callback) {
    debug('registering payment handler')
    this.receiver.registerPaymentHandler(async (params) => {
      debug('got payment chunk. amount=', params.prepare.data.amount)
      const hexId = params.paymentId.toString('hex')

      let accountant = this.accountants.get(hexId)
      // should only allow accountants to be added via getAccountant
      /* if (!accountant) {
        accountant = new CogAccountant({ plugin: this.plugin })
        this.accountants.set(hexId, accountant)
      } */

      if (!accountant) {
        return params.reject('unexpected transfer.')
      }

      // TODO: clean up after reject so we don't leak memory (very important
      // because cogs will run for a very long time)
      return accountant.paymentHandler(params)
    })

    debug('connecting receiver')
    await this.receiver.connect()
  }
}

module.exports = CogListener
