const { createServer } = require('ilp-protocol-stream')
const crypto = require('crypto')
const debug = require('debug')('ilp-cog-listener')

class CogListener {
  constructor (opts) {
    this.plugin = (opts && opts.plugin) || require('ilp-plugin')()
    this.streams = new Map()
    this.receiver = null
  }

  getStream (id) {
    return this.streams.get(id.toString('hex'))
  }

  async cleanUpStream (id) {
    const stream = this.streams.get(id.toString('hex'))
    if (stream) {
      stream.end()
    }
  }

  getDetails (id) {
    return this.server.generateAddressAndSecret(id.toString('hex'))
  }

  async listen (callback) {
    debug('registering payment handler')
    this.server = await createServer({
      plugin: this.plugin
    })

    this.server.on('connection', conn => {
      let streamSet = false
      const tag = conn.connectionTag

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
        stream.on('end', () => this.streams.delete(stream))
      })
    })
  }
}

module.exports = CogListener
