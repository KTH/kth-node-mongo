/* eslint-env mocha */
'use strict'

const mockery = require('mockery')
const expect = require('chai').expect
const EventEmitter = require('events')

const mockLogger = {}

mockLogger.debug = mockLogger.info = mockLogger.error = mockLogger.warn = () => {}

const connectedApi = {
  name: 'ConnectedAPI',
  connect: function (options) {
    this.connection.emit('connected')
  },
  connection: new EventEmitter()
}

const errorApi = {
  name: 'ErrorAPI',
  connect: function (options) {
    this.connection.emit('error', {
      message: 'DATABASE ERROR'
    })
  },
  connection: new EventEmitter()
}

describe('Test kth-node-mongo connection process', function () {
  beforeEach(function () {
    mockery.enable({
      warnOnUnregistered: false,
      warnOnReplace: false,
      useCleanCache: true
    })
  })
  afterEach(function () {
    mockery.disable()
  })

  it('should call the connect method', function (done) {
    mockery.registerMock('mongoose', connectedApi)
    const kthNodeMongo = require('../index')
    kthNodeMongo.connect({ logger: mockLogger }).then(() => {
      expect(kthNodeMongo.isOk()).to.be.true
      mockery.deregisterAll()
      done()
    })
  })

  it('should provide some sane default options', function (done) {
    const checkOptionsApi = {
      name: 'CheckOptionsAPI',
      connect: function (uri, options) {
        expect(uri).to.be.undefined // no default uri
        expect(options).to.be.defined
        this.connection.emit('connected')
      },
      connection: new EventEmitter()
    }
    mockery.registerMock('mongoose', checkOptionsApi)

    const kthNodeMongo = require('../index')
    kthNodeMongo.connect({ logger: mockLogger }).then(() => {
      expect(kthNodeMongo.isOk()).to.be.true
      mockery.deregisterAll()
      done()
    })
  })

  it('should disconnect on error', function (done) {
    errorApi.disconnect = function () {
      expect(kthNodeMongo.isOk()).to.be.false
      done()
    }
    mockery.registerMock('mongoose', errorApi)
    const kthNodeMongo = require('../index')
    kthNodeMongo.connect({ logger: mockLogger }).then(() => {})
    mockery.deregisterAll()
  })
})
