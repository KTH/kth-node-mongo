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

const MANUAL_RECONNECT_TIMEOUT = 60000

const standardOptions = {
  ssl: false,
  logger: stdLogger,

  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,

  keepAlive: 30000,
  socketTimeoutMS: 360000,
}

function _consoleLogger(level) {
  return (file, msg) => {
    // eslint-disable-next-line no-console
    console.log(new Date().toISOString(), level, file, msg)
  }
}

const Global = {
  isConnected: null,
  activeReconnectingTimerID: null,
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
async function connect(options) {
  const log = options.logger || kthLog
  const { dbUri } = options
  const dbOptions = _getMongoOptionsWithoutDbUri(options)

  mongoose.connection.on('error', error => {
    log.fatal('kth-node-mongo: Connection error - manually checking connection after some delay', {
      MANUAL_RECONNECT_TIMEOUT,
      error,
      dbOptions,
    })

    Global.isConnected = false
    _manualReconnectAfterSomeDelay({
      dbUri,
      dbOptions,
      log,
      logWithFatal: true,
      logText: 'Missing automatic reconnect after connection error',
    })
  })

  mongoose.connection.on('connected', () => {
    log.info('kth-node-mongo: Default connection established')

    Global.isConnected = true
    _cancelManualReconnectIfScheduled()
  })

  mongoose.connection.on('disconnected', () => {
    log.error('kth-node-mongo: Default connection lost')

    Global.isConnected = false
    _manualReconnectAfterSomeDelay({
      dbUri,
      dbOptions,
      log,
      logWithFatal: true,
      logText: 'Missing automatic reconnect after disconnect',
    })
  })

  mongoose.connection.on('reconnected', () => {
    log.info('kth-node-mongo: Default connection re-established')

    Global.isConnected = true
    _cancelManualReconnectIfScheduled()
  })

  // @TODO
  // Find out if the "reconnectFailed" event was also deprecated
  // and gets needless with "useUnifiedTopology: true"
  mongoose.connection.on('reconnectFailed', error => {
    log.fatal('kth-node-mongo: Could not reconnect to DB', { error, dbOptions })

    Global.isConnected = false
    _manualReconnectAfterSomeDelay({
      dbUri,
      dbOptions,
      log,
      logWithFatal: true,
      logText: 'Missing automatic reconnect after failed reconnect',
    })
  })

  log.info('kth-node-mongo: Connecting database...')

  try {
    await mongoose.connect(dbUri, dbOptions)
  } catch (error) {
    log.fatal('kth-node-mongo: Initial connect failed')
    Global.isConnected = false
    return false
  }

  Global.isConnected = true
  return true
}

function _getMongoOptionsWithoutDbUri(options) {
  const dbOptions = { ...standardOptions, ...options }
  delete dbOptions.dbUri
  return dbOptions
}

/**
 * @param {object} inputBag
 * @param {string} inputBag.dbUri
 * @param {object} inputBag.dbOptions
 * @param {object} inputBag.log
 * @param {boolean} [inputBag.logWithFatal=false]
 * @param {string} [inputBag.logText]
 */
function _manualReconnectAfterSomeDelay({ dbUri, dbOptions, log, logWithFatal, logText }) {
  if (Global.activeReconnectingTimerID != null) {
    return
  }

  const _reconnect = () => {
    const basicMsg =
      'Looks like automatic reconnect is not working, attempting to reconnect manually'
    const _logText = logText
      ? `kth-node-mongo: ${logText} (${basicMsg})`
      : `kth-node-mongo: ${basicMsg}`
    if (logWithFatal) {
      log.fatal(_logText)
    } else {
      log.info(_logText)
    }

    Global.activeReconnectingTimerID = null
    mongoose.connect(dbUri, dbOptions)
  }

  Global.activeReconnectingTimerID = 'pending'

  mongoose.connection.close(() => {
    if (Global.activeReconnectingTimerID === 'pending') {
      Global.activeReconnectingTimerID = setTimeout(_reconnect, MANUAL_RECONNECT_TIMEOUT)
    } else {
      Global.activeReconnectingTimerID = null
    }
  })
}

function _cancelManualReconnectIfScheduled() {
  if (Global.activeReconnectingTimerID == null) {
    return
  }

  if (Global.activeReconnectingTimerID === 'pending') {
    Global.activeReconnectingTimerID = 'skip'
    return
  }

  clearTimeout(Global.activeReconnectingTimerID)
  Global.activeReconnectingTimerID = null
}
