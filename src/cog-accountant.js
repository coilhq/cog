const IlpPacket = require('ilp-packet')
const EventEmitter = require('events')
const debug = require('debug')('ilp-cog-accountant')

class CogAccountant extends EventEmitter {
  constructor ({
    plugin,
    socket
  }) {
    super()

    this.plugin = plugin
    this.socket = socket

    this.target = 0
    this.balance = 0
    this.spent = 0

    socket.on('incoming_chunk', () => {
      this.emit('_balance', this.getBalance())
    })
  }

  // we have this so the accountant can be used as a plugin
  async sendTransfer () {}
  async connect () {}

  getBalance () {
    return Number(this.socket.balance) - this.spent
  }

  async awaitBalance (amount) {
    debug('awaiting balance. amount=' + amount)

    if (this.getBalance() >= amount) return
    this.target += Number(amount) - this.getBalance()
    this.socket.setMinAndMaxBalance(this.target)

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
      debug('sending prepare. amount=' + parsedRequest.data.amount)
      await this.awaitBalance(parsedRequest.data.amount)
      this.spent += parsedRequest.data.amount
    }

    debug('sending data')
    const response = await this.plugin.sendData(data)
    const parsedResponse = IlpPacket.deserializeIlpPacket(data)

    // TODO: account for an invalid non-reject response?
    // TODO: support any other reject types?
    if (parsedResponse.type === IlpPacket.Type.TYPE_ILP_REJECT) {
      this.spent -= parsedRequest.data.amount
      this.emit('_balance', this.getBalance())
    }

    return response
  }

  async disconnect () {
    this.close = true
  }
}

CogAccountant.version = 2 // LPI version for compat
module.exports = CogAccountant
