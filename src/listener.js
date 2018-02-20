const { PaymentServer, createSocket } = require('.')
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
    this.sockets = new Map()
    this.receiver = null
  }

  async getAccountant (id) {
    const hexId = id.toString('hex')
    let accountant = this.accountants.get(hexId)
    if (accountant) {
      throw new Error('accountant already exists for this token')
    }

    const socket = this.getSocket(id)
    accountant = new CogAccountant({ plugin: this.plugin, socket })
    this.accountants.set(hexId, accountant)

    debug('returning accountant for', id)
    return accountant
  }

  async cleanUpAccountant (id) {
    // TODO
    const hexId = id.toString('hex')
    let accountant = this.accountants.get(hexId)
    if (accountant) {
      await accountant.disconnect()
      this.sockets.delete(hexId)
      this.accountants.delete(hexId)
    }
  }

  getSocket (id) {
    const hexId = id.toString('hex')
    let socket = this.sockets.get(hexId)
    if (!socket) {
      socket = this.receiver.createSocket({ allowRefunds: false })
      this.sockets.set(hexId, socket)
    }

    debug('returning socket. id=' + hexId)
    return socket
  }

  async listen (callback) {
    debug('registering payment handler')

    this.receiver = new PaymentServer({
      plugin: this.plugin,
      secret: this.secret
    })

    await this.receiver.connect()
  }
}

module.exports = CogListener
