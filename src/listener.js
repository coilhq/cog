const { createServer } = require('ilp-protocol-stream')
const crypto = require('crypto')
const debug = require('debug')('ilp-cog-listener')
const EventEmitter = require('events')

class CogListener extends EventEmitter {
  constructor (opts) {
    super()

    this.plugin = (opts && opts.plugin) || require('ilp-plugin')()
    this.streams = new Map()
    this.receiver = null
  }

  async getStream (id) {
    return this.streams.get(id.toString('hex'))
  }

  async cleanUpStream (id) {
    const stream = this.streams.get(id.toString('hex'))
    if (stream) {
      stream.end()
    }
  }

  getDetails (id) {
    return this.server.generateAddressAndSecret(id)
  }

  async listen (callback) {
    debug('registering payment handler')
    this.server = await createServer({
      plugin: this.plugin
    })

    server.on('connection', conn => {
      let streamSet = false
      const tag = conn.connectionTag.toString('hex')

      if (this.streams.get(tag)) {
        console.error('two connections on tag. tag=' + tag)
        conn.end()
        return
      }

      conn.on('stream', stream => {
        // make sure that there is only one stream
        if (streamSet) {
          console.error('opened two streams on connection. tag=' + tag)
          stream.end()
          conn.end()
          return
        }

        streamSet = true

        this.streams.set(tag, stream)
        this.emit('_' + tag)

        stream.on('end', this.streams.delete(stream))
      })
    })
  }
}

module.exports = CogListener
