/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const mongoose = require('mongoose')
const kthLog = require('kth-node-log')

module.exports = { connect, isOk }

const stdLogger = {
  debug: _consoleLogger('debug'),
  info: _consoleLogger('info'),
  warn: _consoleLogger('warn'),
  error: _consoleLogger('error'),
  fatal: _consoleLogger('fatal'),
}

const DONT_EVER_TIMEOUT_CONNECTIONS = true

const ONE_MINUTE = 60000
const ONE_HOUR = 60 * ONE_MINUTE
const ONE_DAY = 24 * ONE_HOUR

const REJECT_IF_INITIAL_CONNECT_FAILS_TIMEOUT = 30000
const SIGNAL_MISSING_CONNECTION_TIMEOUT = 2 * ONE_MINUTE

const standardOptions = {
  ssl: false,
  logger: stdLogger,

  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,

  keepAlive: 30000,
  socketTimeoutMS: DONT_EVER_TIMEOUT_CONNECTIONS ? 0 : ONE_HOUR,
  serverSelectionTimeoutMS: DONT_EVER_TIMEOUT_CONNECTIONS ? 0 : ONE_DAY,
}

function _consoleLogger(level) {
  return (file, msg) => {
    // eslint-disable-next-line no-console
    console.log(new Date().toISOString(), level, file, msg)
  }
}

const Global = {
  isConnected: null,
  checkConnectionOnceTimerID: null,
}

/**
 * @returns {boolean}
 *      True iff default connection to MongoDB is currently established
 */
function isOk() {
  return Global.isConnected === true
}

/**
 * setup Mongoose connection to mongoDB
 *
 * Mongoose connect is called once by the app.js & connection established
 *
 * @param {object} options
 * @param {string} options.dbUri
 * @param {object} [options.logger] user-defined logging service
 *
 * @returns {Promise<boolean>}
 *      Resolves with true after the connection was established
 */
function connect(options) {
  const log = options.logger || kthLog
  const { dbUri } = options
  const dbOptions = _getMongoOptionsWithoutDbUri(options)

  mongoose.connection.on('connected', () => {
    log.info('kth-node-mongo: Default connection established')

    Global.isConnected = true
    _cancelMissingConnectionSignal()
  })

  mongoose.connection.on('reconnected', () => {
    log.info('kth-node-mongo: Default connection re-established')

    Global.isConnected = true
    _cancelMissingConnectionSignal()
  })

  mongoose.connection.on('error', error => {
    log.fatal('kth-node-mongo: Connection error', { error, dbOptions })

    Global.isConnected = false
  })

  mongoose.connection.on('disconnected', () => {
    log.error('kth-node-mongo: Default connection lost')

    Global.isConnected = false
    _sendMissingConnectionSignalOnceAfterSomeDelay({
      log,
      logText: 'got "disconnected" event earlier',
    })
  })

  log.info('kth-node-mongo: Connecting database...')

  return new Promise((resolve, reject) => {
    let result = null

    mongoose
      .connect(dbUri, dbOptions)
      .then(() => {
        if (result == null) {
          Global.isConnected = true
          result = true
          resolve(true)
        }
      })
      .catch(error => {
        if (result == null) {
          Global.isConnected = false
          result = false
          reject(error)
        }
      })

    if (REJECT_IF_INITIAL_CONNECT_FAILS_TIMEOUT > 0) {
      setTimeout(() => {
        if (result == null) {
          Global.isConnected = false
          result = false
          reject(new Error('kth-node-mongo: Timeout on initial connect'))
        }
      }, REJECT_IF_INITIAL_CONNECT_FAILS_TIMEOUT)
    }
  })
}

function _getMongoOptionsWithoutDbUri(options) {
  const dbOptions = { ...standardOptions, ...options }
  delete dbOptions.dbUri
  return dbOptions
}

/**
 * @param {object} inputBag
 * @param {object} inputBag.log
 * @param {string} [inputBag.logText]
 */
function _sendMissingConnectionSignalOnceAfterSomeDelay({ log, logText }) {
  if (Global.checkConnectionOnceTimerID != null) {
    return
  }

  const _sendSignal = () => {
    const _basicMsg = 'Connection is still missing - no automatic reconnect happened'
    const _logText = `kth-node-mongo: ${_basicMsg}` + (logText ? ` - ${logText}` : '')
    log.fatal(_logText, { SIGNAL_MISSING_CONNECTION_TIMEOUT })

    Global.checkConnectionOnceTimerID = null
  }

  Global.checkConnectionOnceTimerID = setTimeout(_sendSignal, SIGNAL_MISSING_CONNECTION_TIMEOUT)
}

function _cancelMissingConnectionSignal() {
  if (Global.checkConnectionOnceTimerID == null) {
    return
  }

  clearTimeout(Global.checkConnectionOnceTimerID)
  Global.checkConnectionOnceTimerID = null
}
