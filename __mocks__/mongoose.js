/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const EventEmitter = require('events')

const Mockup = {
  _setMockupMode,
  name: null,
  connect: null,
  disconnect: null,
  connection: null,
}

// @ts-ignore
class TestEmitter extends EventEmitter {
  constructor({ close }) {
    super()
    if (typeof close === 'function') {
      this.close = close.bind(Mockup)
    }
  }
}

function _setMockupMode({ name, connect, disconnect, close }) {
  Mockup.name = name
  Mockup.connect = typeof connect === 'function' ? connect.bind(Mockup) : null
  Mockup.disconnect = typeof disconnect === 'function' ? disconnect.bind(Mockup) : null
  Mockup.connection = new TestEmitter({ close })
}

module.exports = Mockup
