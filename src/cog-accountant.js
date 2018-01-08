const IlpPacket = require('ilp-packet')
const EventEmitter = require('events')

class CogAccountant extends EventEmitter {
  constructor ({
    plugin
  }) {
    this.plugin = plugin
    this.balance = 0
  }

  // TODO: arrow function
  async paymentHandler ({
    prepare,
    accept,
    reject
  }) {
    if (this.close) {
      reject('this contract has completed')
    }

    // TODO: bignumbers instead?
    this.balance += Number(prepare.amount)
    this.emit('_balance', this.balance)
    await accept()
  }

  getBalance () {
    return this.balance
  }

  async awaitBalance (amount) {
    if (this.balance >= amount) return
    return new Promise(resolve => {
      const handleNewBalance = (newBalance) => {
        if (newBalance >= amount) {
          setImmediate(() => this.removeListener('_balance', handleNewBalance))
          resolve()
        }
      }

      this.on('_balance', handleNewBalance)
    })
  }

  // TODO: arrow function
  async sendData (data) {
    // TODO: support non-ILP data?
    const parsedRequest = IlpPacket.deserializeIlpPacket(data)
    
    if (parsedRequest.type === IlpPacket.Type.TYPE_ILP_PREPARE) {
      await this.awaitBalance(parsedRequest.data.amount)
      this.balance -= parsedRequest.data.amount
    }

    const response = await this.plugin.sendData(data)
    const parsedResponse = IlpPacket.deserializeIlpPacket(data)

    // TODO: account for an invalid non-reject response?
    // TODO: support any other reject types?
    if (parsedResponse.type === IlpPacket.Type.TYPE_ILP_REJECT) {
      this.balance += parsedRequest.data.amount
      this.emit('_balance', this.balance)
    }

    return response
  }

  async disconnect () {
    this.close = true
  }
}

module.exports = CogAccountant
