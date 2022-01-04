/* eslint-disable import/no-unresolved */
const kthLog = require('@kth/log')

// eslint-disable import/no-extraneous-dependencies
const mongoose = require('mongoose')

const standardOptions = {
  ssl: false,
  // keepAlive: true,
  // keepAliveInitialDelay: 0,
  // socketTimeoutMS: 0,
  // serverSelectionTimeoutMS: 5000,
  // heartbeatFrequencyMS: 5000,
}

const Global = {
  isConnected: null,
  checkConnectionOnceTimerID: null,
}

function _getMongoOptionsWithoutDbUri(options) {
  const dbOptions = { ...standardOptions, ...options }
  delete dbOptions.dbUri
  delete dbOptions.logger
  return dbOptions
}

/**
 * @returns {boolean}
 *      True iff default connection to MongoDB is currently established
 */
function isOk() {
  return Global.isConnected === true
}

function getLogger(logger = kthLog) {
  return logger.child({ package: '@kth/mongo' })
}

async function connect(options) {
  const log = getLogger(options.logger)
  const { dbUri } = options
  const dbOptions = _getMongoOptionsWithoutDbUri(options)

  try {
    log.info('DATABASE: Connecting database...')

    if (options.mongooseDebug) {
      log.warn('Using debug for Mongoose. This will hurt the performance.')
      mongoose.set('debug', true)
    }

    mongoose.connection.on('connected', () => {
      log.info('DATABASE: Default connection established')
      Global.isConnected = true
    })

    mongoose.connection.on('reconnected', () => {
      log.info('DATABASE: Default connection re-established')
      Global.isConnected = true
    })

    mongoose.connection.on('disconnected', () => {
      log.warn('DATABASE: Default connection lost')
      Global.isConnected = false
    })

    mongoose.connection.on('error', error => {
      log.fatal('DATABASE: Connection error', { error })
      Global.isConnected = false
    })

    return mongoose.connect(dbUri, dbOptions).then(data => {
      log.debug(`DATABASE connected: ${data.connection.host}@${data.connection.name}`)
      log.debug(`DATABASE driver version: ${data.connection._connectionOptions.driverInfo.version}`)
    })
  } catch (err) {
    log.error('DATABASE:', err?.reason || err)
    return null
  }
}
module.exports = { connect, isOk }
