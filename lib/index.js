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

const ONE_MINUTE = 60000
// const ONE_HOUR = 60 * ONE_MINUTE
// const ONE_DAY = 24 * ONE_HOUR

const TIMEOUT_TO_REJECT_IF_INITIAL_CONNECT_FAILS = 30000
const TIMEOUT_TO_SIGNAL_MISSING_CONNECTION = 2 * ONE_MINUTE

//
// From "mongodb/lib/core/connection/connect.js:272":
//    if (keepAliveInitialDelay > socketTimeout) {
//      keepAliveInitialDelay = Math.round(socketTimeout / 2);
//    }
// (If socketTimeoutMS === 0, keepAliveInitialDelay will be set to 0, too.)
//

// heartbeatFrequencyMS defaults to 10000 ms;
// lowering it when using useUnifiedTopology
// seems to have influence on two things (!?):
// - MongoDB driver checks more often if the server connection is still available (or directly reconnects otherwise)
// - On average, MongoDB driver will take less time to reestablish the connect (max heartbeatFrequencyMS)

const standardOptions = {
  ssl: false,
  logger: stdLogger,

  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,

  keepAlive: false,
  socketTimeoutMS: 0,
  serverSelectionTimeoutMS: 0,
  heartbeatFrequencyMS: 5000,
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

  if (dbOptions.keepAlive && !dbOptions.socketTimeoutMS) {
    log.warn(
      'kth-node-mongo: Using option "keepAlive" when "socketTimeoutMS" is zero' +
        ' will most likely be ignored by MongoDB driver'
    )
  }

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
    let timeoutID = null
    let result = null

    mongoose
      .connect(dbUri, dbOptions)
      .then(() => {
        if (result == null) {
          Global.isConnected = true
          result = true
          resolve(true)
        }
        if (timeoutID != null) {
          clearTimeout(timeoutID)
          timeoutID = null
        }
      })
      .catch(error => {
        if (result == null) {
          Global.isConnected = false
          result = false
          reject(error)
        }
        if (timeoutID != null) {
          clearTimeout(timeoutID)
          timeoutID = null
        }
      })

    if (TIMEOUT_TO_REJECT_IF_INITIAL_CONNECT_FAILS > 0) {
      timeoutID = setTimeout(() => {
        if (result == null) {
          Global.isConnected = false
          result = false
          reject(new Error('kth-node-mongo: Timeout on initial connect'))
        }
      }, TIMEOUT_TO_REJECT_IF_INITIAL_CONNECT_FAILS)
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
    log.fatal(_logText, { TIMEOUT_TO_SIGNAL_MISSING_CONNECTION })

    Global.checkConnectionOnceTimerID = null
  }

  Global.checkConnectionOnceTimerID = setTimeout(_sendSignal, TIMEOUT_TO_SIGNAL_MISSING_CONNECTION)
}

function _cancelMissingConnectionSignal() {
  if (Global.checkConnectionOnceTimerID == null) {
    return
  }

  clearTimeout(Global.checkConnectionOnceTimerID)
  Global.checkConnectionOnceTimerID = null
}
