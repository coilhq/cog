const IlpPacket = require('ilp-packet')
const debug = require('debug')('ilp-cog-accountant')

class CogAccountant {
  constructor (stream) {
    super()

    this.stream = stream
    this.balance = 0
  }

  // we have this so the accountant can be used as a plugin
  async sendTransfer () {}
  async connect () {}

  getBalance () {
    return this.balance
  }

  // TODO: arrow function
  async sendData (data) {
    // TODO: support non-ILP data?
    const parsedRequest = IlpPacket.deserializeIlpPacket(data)
    
    if (parsedRequest.type === IlpPacket.Type.TYPE_ILP_PREPARE) {
      debug('sending prepare. amount=' + parsedRequest.data.amount)
      await this.stream.receiveTotal(this.stream.receiveMax + parsedRequest.data.amount)
    }

    debug('sending data')
    const response = await this.plugin.sendData(data)
    const parsedResponse = IlpPacket.deserializeIlpPacket(data)

    // TODO: account for an invalid non-reject response?
    // TODO: support any other reject types?
    /* TODO: how to lower the receive max after this?
    if (parsedResponse.type === IlpPacket.Type.TYPE_ILP_REJECT) {
      this.balance += parsedRequest.data.amount
      this.emit('_balance', this.balance)
    }*/

    return response
  }

  async disconnect () {}
}

CogAccountant.version = 2 // LPI version for compat
module.exports = CogAccountant
