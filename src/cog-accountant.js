const IlpPacket = require('ilp-packet')
const debug = require('debug')('ilp-cog-accountant')

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
    
    if (parsedRequest.type === IlpPacket.Type.TYPE_ILP_PREPARE) {
      debug('sending prepare. amount=' + parsedRequest.data.amount)

      const amount = Math.max(0, parsedRequest.data.amount - this.surplus)
      this.surplus = Math.max(0, this.surplus - parsedRequest.data.amount)

      await this.stream.receiveTotal(this.stream.receiveMax + amount)
    }

    debug('sending data')
    const response = await this.plugin.sendData(data)
    const parsedResponse = IlpPacket.deserializeIlpPacket(data)

    if (parsedResponse.type === IlpPacket.Type.TYPE_ILP_REJECT) {
      this.surplus += parsedRequest.data.amount
    }

    return response
  }

  async disconnect () {}
}

CogAccountant.version = 2 // LPI version for compat
module.exports = CogAccountant
