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

  it('should call the connect method', async () => {
    let callCounter = 0

    async function mockConnect() {
      callCounter++
      this.connection.emit('connected')
    }
    setMongooseMockupMode({ name: 'ConnectedAPI', connect: mockConnect })

    await connect({ dbUri, logger })

    const allLogs = listAllLoggerCalls()
    expect(allLogs).toContainAllKeys(['info'])
    expect(allLogs.info).toHaveLength(2)
    expect(allLogs.info[0][0]).toMatchInlineSnapshot(`"kth-node-mongo: Connecting database..."`)
    expect(allLogs.info[1][0]).toMatchInlineSnapshot(
      `"kth-node-mongo: Default connection established"`
    )

    expect(callCounter).toBe(1)
    expect(isOk()).toBe(true)
  })

  it('should provide some sane default options', async () => {
    let callCounter = 0

    async function mockConnect(uri, options) {
      callCounter++
      expect(uri).toBe(dbUri)
      expect(options).toContainAllKeys([
        'ssl',
        'logger',
        'useNewUrlParser',
        'useFindAndModify',
        'useCreateIndex',
        'useUnifiedTopology',
        'keepAlive',
        'keepAliveInitialDelay',
        'socketTimeoutMS',
        'serverSelectionTimeoutMS',
        'heartbeatFrequencyMS',
      ])
      expect(options.logger).toBe(logger)
      this.connection.emit('connected')
    }
    setMongooseMockupMode({ name: 'CheckOptionsAPI', connect: mockConnect })

    await connect({ dbUri, logger })

    expect(callCounter).toBe(1)
    expect(isOk()).toBe(true)
  })

  it.skip('should disconnect on error', done => {
    async function mockConnect() {
      this.connection.emit('error', { message: 'DATABASE ERROR' })
    }
    function mockClose() {
      const allLogs = listAllLoggerCalls()
      expect(allLogs).toContainAllKeys(['info', 'fatal'])
      expect(allLogs.info).toHaveLength(1)
      expect(allLogs.info[0][0]).toMatchInlineSnapshot(`"kth-node-mongo: Connecting database..."`)
      expect(allLogs.fatal).toHaveLength(1)
      expect(allLogs.fatal[0][0]).toMatchInlineSnapshot(
        `"kth-node-mongo: Connection error - manually checking connection after some delay"`
      )

      expect(isOk()).toBe(false)
      done()
    }
    setMongooseMockupMode({ name: 'ErrorAPI', connect: mockConnect, close: mockClose })

    connect({ dbUri, logger })
  })
})
