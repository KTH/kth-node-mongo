/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

module.exports = { connect, isOk }

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const kthLog = require('kth-node-log')

const stdLogger = {
  debug: _consoleLogger('debug'),
  info: _consoleLogger('info'),
  warn: _consoleLogger('warn'),
  error: _consoleLogger('error'),
  fatal: _consoleLogger('fatal'),
}
const RECONNECT_TIMEOUT = 30000

/**
 * MongoDB Driver has very different defaults to some properties of standardOptions,
 * in case of problems with our module it might help to use the "official" defaults:
 * - keepAlive: 30.000 (ms)
 * - connectTimeoutMS: 30.000 (ms)
 * - socketTimeoutMS: 360.000 (ms)
 * - reconnectInterval: 1000 (ms)
 */
const standardOptions = {
  keepAlive: 1,
  connectTimeoutMS: 0,
  socketTimeoutMS: 0,
  ssl: false,
  autoReconnect: true,
  reconnectTries: 30,
  reconnectInterval: RECONNECT_TIMEOUT,
  useNewUrlParser: true,
  logger: stdLogger,
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
 * @param {number} [options.reconnectInterval] milliseconds to wait after connection error
 *
 * @returns {Promise<boolean>}
 *      Resolves with true after the connection was established
 */
function connect(options) {
  const log = options.logger || kthLog
  const { dbUri } = options
  const dbOptions = _getMongoOptionsWithoutDbUri(options)

  return new Promise(resolve => {
    mongoose.connection.on('error', dbErr => {
      const { reconnectInterval: delayMilliseconds, keepAlive } = dbOptions
      log.fatal(
        'kth-node-mongo: Unexpectedly got a connection error, reconnecting after some delay ' +
          '- Have you accidentally disabled keepAlive?',
        { err: dbErr.message, delayMilliseconds, keepAlive }
      )

      Global.isConnected = false

      if (Global.activeReconnectingTimerID == null) {
        Global.activeReconnectingTimerID = 'in progress'
        mongoose.connection.close(() => {
          Global.activeReconnectingTimerID = setTimeout(() => {
            Global.activeReconnectingTimerID = null
            log.info('kth-node-mongo: Attempting to reconnect')
            mongoose.connect(dbUri, dbOptions)
          }, delayMilliseconds)
        })
      }
    })

    mongoose.connection.on('connected', () => {
      log.info('kth-node-mongo: Default connection established')
      Global.isConnected = true
      resolve(true)
    })

    mongoose.connection.on('disconnected', () => {
      log.fatal('kth-node-mongo: Default connection lost')
      Global.isConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      log.info('kth-node-mongo: Default connection re-established')
      Global.isConnected = true
    })

    log.info('kth-node-mongo: Connecting database...', { dbUri })
    mongoose.connect(dbUri, dbOptions)
  })
}

function _getMongoOptionsWithoutDbUri(options) {
  const dbOptions = { ...standardOptions, ...options }
  delete dbOptions.dbUri
  return dbOptions
}
