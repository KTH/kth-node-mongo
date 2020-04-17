/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const MongooseMockup = require('mongoose')
// @ts-ignore
const { setMockupMode } = MongooseMockup

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

const kthNodeMongo = require('./index')

describe('Test kth-node-mongo connection process', () => {
  it('should call the connect method', () => {
    function connect() {
      this.connection.emit('connected')
    }
    setMockupMode({ name: 'ConnectedAPI', connect })

    return kthNodeMongo.connect({ logger: mockLogger }).then(() => {
      expect(kthNodeMongo.isOk()).toBe(true)
    })
  })

  it('should provide some sane default options', () => {
    function connect(uri, options) {
      expect(uri).toBeUndefined()
      expect(options).not.toBeUndefined()
      this.connection.emit('connected')
    }
    setMockupMode({ name: 'CheckOptionsAPI', connect })

    return kthNodeMongo.connect({ logger: mockLogger }).then(() => {
      expect(kthNodeMongo.isOk()).toBe(true)
    })
  })

  it('should disconnect on error', done => {
    function connect() {
      this.connection.emit('error', { message: 'DATABASE ERROR' })
    }
    function disconnect() {
      expect(kthNodeMongo.isOk()).toBe(false)
      done()
    }
    setMockupMode({ name: 'ErrorAPI', connect, disconnect })

    kthNodeMongo.connect({ logger: mockLogger })
  })
})
