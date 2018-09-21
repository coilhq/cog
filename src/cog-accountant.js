const IlpPacket = require('ilp-packet')
const debug = require('debug')('ilp-cog-accountant')
const DEFAULT_PAYMENT_TIMEOUT = 5000

class CogAccountant {
  constructor (stream, plugin) {
    this.stream = stream
    this.plugin = plugin || require('ilp-plugin')()
    this.surplus = 0
  }

  // we have this so the accountant can be used as a plugin
  async sendTransfer () {}
  async connect () {
    await this.plugin.connect()
  }

  // TODO: arrow function
  async sendData (data) {
    // TODO: support non-ILP data?
    const parsedRequest = IlpPacket.deserializeIlpPacket(data)

    const response = await this.plugin.sendData(data)
    const parsedResponse = IlpPacket.deserializeIlpPacket(response)

    if (parsedResponse.type === IlpPacket.Type.TYPE_ILP_REJECT) {
      return response
    }

    if (parsedResponse.type !== IlpPacket.Type.TYPE_ILP_FULFILL) {
      return response
    }

    if (parsedRequest.type === IlpPacket.Type.TYPE_ILP_PREPARE) {
      debug('sending prepare. amount=' + parsedRequest.data.amount)
      if (parsedRequest.data.amount === '0') {
        return response
      }

      const amount = Math.max(0, parsedRequest.data.amount - this.surplus)
      this.surplus = Math.max(0, this.surplus - parsedRequest.data.amount)

      debug('awaiting.' +
        ' receiveTotal=' + (Number(this.stream.receiveMax) + Number(amount)) +
        ' totalReceived=' + this.stream.totalReceived)

      await this.stream.receiveTotal(Number(this.stream.receiveMax) + Number(amount), DEFAULT_PAYMENT_TIMEOUT),
    }

    return response
  }

  registerDataHandler (handler) {
    this.plugin.registerDataHandler(handler)
  }

  deregisterDataHandler () {
    this.plugin.deregisterDataHandler()
  }

  async disconnect () {}
}

CogAccountant.version = 2 // LPI version for compat
module.exports = CogAccountant
