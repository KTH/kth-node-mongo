/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const EventEmitter = require('events')

// @ts-ignore
class TestEmitter extends EventEmitter {}

const Mockup = {
  setMockupMode,
  name: null,
  connection: null,
  connect: null,
  disconnect: null,
}

function setMockupMode({ name, connect, disconnect }) {
  Mockup.name = name
  Mockup.connection = new TestEmitter()
  Mockup.connect = connect.bind(Mockup)
  Mockup.disconnect = typeof disconnect === 'function' ? disconnect.bind(Mockup) : null
}

module.exports = Mockup
