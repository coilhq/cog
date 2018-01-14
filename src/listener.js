const { createReceiver } = require('ilp-protocol-psk2')
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
    this.receiver = null
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
    const hexId = id.toString('hex')
    let accountant = this.accountants.get(hexId)
    if (accountant) {
      return accountant.disconnect()
    }
  }

  getPskDetails () {
    return this.receiver.generateAddressAndSecret()
  }

  async listen (callback) {
    debug('registering payment handler')
    this.receiver = await createReceiver({
      plugin: this.plugin,
      paymentHandler: async (params) => {
        debug('got payment chunk. amount=' + params.prepare.amount)
        const hexId = params.id.toString('hex')

        let accountant = this.accountants.get(hexId)
        if (!accountant) {
          return params.reject('unexpected transfer.')
        }

        // TODO: clean up after reject so we don't leak memory (very important
        // because cogs will run for a very long time)
        return accountant.paymentHandler(params)
      }
    })

    // debug('connecting receiver')
    // await this.receiver.connect()
  }
}

module.exports = CogListener
