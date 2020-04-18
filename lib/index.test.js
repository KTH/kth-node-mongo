/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const MongooseMockup = require('mongoose')
// @ts-ignore
const { _setMockupMode: setMongooseMockupMode } = MongooseMockup

const mockLogger = require('kth-node-log')
// @ts-ignore
const { _listAllCalls: listAllLoggerCalls } = mockLogger

const { connect, isOk } = require('./index')

describe('Test kth-node-mongo connection process', () => {
  const dbUri = 'test-uri'
  const logger = mockLogger

  it('should call the connect method', () => {
    function mockConnect() {
      this.connection.emit('connected')
    }
    setMongooseMockupMode({ name: 'ConnectedAPI', connect: mockConnect })

    return connect({ dbUri, logger }).then(() => {
      const allLogs = listAllLoggerCalls()
      expect(allLogs).toContainAllKeys(['info'])
      expect(allLogs.info).toHaveLength(2)
      expect(allLogs.info[0][0]).toMatchInlineSnapshot(`"kth-node-mongo: Connecting database..."`)
      expect(allLogs.info[1][0]).toMatchInlineSnapshot(
        `"kth-node-mongo: Default connection established"`
      )

      expect(isOk()).toBe(true)
    })
  })

  it('should provide some sane default options', () => {
    function mockConnect(uri, options) {
      expect(uri).toBe(dbUri)
      expect(options).toContainAllKeys([
        'keepAlive',
        'connectTimeoutMS',
        'socketTimeoutMS',
        'ssl',
        'autoReconnect',
        'reconnectTries',
        'reconnectInterval',
        'useNewUrlParser',
        'logger',
      ])
      expect(options.logger).toBe(logger)
      this.connection.emit('connected')
    }
    setMongooseMockupMode({ name: 'CheckOptionsAPI', connect: mockConnect })

    return connect({ dbUri, logger }).then(() => {
      expect(isOk()).toBe(true)
    })
  })

  it('should disconnect on error', done => {
    function mockConnect() {
      this.connection.emit('error', { message: 'DATABASE ERROR' })
    }
    function mockClose() {
      const allLogs = listAllLoggerCalls()
      expect(allLogs).toContainAllKeys(['info', 'fatal'])
      expect(allLogs.info).toHaveLength(1)
      expect(allLogs.info[0][0]).toMatchInlineSnapshot(`"kth-node-mongo: Connecting database..."`)
      expect(allLogs.fatal).toHaveLength(1)
      expect(allLogs.fatal[0][0]).toMatchInlineSnapshot(
        `"kth-node-mongo: Unexpectedly got a connection error, reconnecting after some delay - Have you accidentally disabled keepAlive?"`
      )

      expect(isOk()).toBe(false)
      done()
    }
    setMongooseMockupMode({ name: 'ErrorAPI', connect: mockConnect, close: mockClose })

    connect({ dbUri, logger })
  })
})
