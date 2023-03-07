const kthLog = require('@kth/log')
import mongoose from 'mongoose'
const standardOptions = {
  ssl: false,
  // keepAlive: true,
  // keepAliveInitialDelay: 0,
  // socketTimeoutMS: 0,
  // serverSelectionTimeoutMS: 5000,
  // heartbeatFrequencyMS: 5000,
}

type TGlobal = {
  isConnected?: boolean
  checkConnectionOnceTimerID: null
}

const Global: TGlobal = {
  isConnected: undefined,
  checkConnectionOnceTimerID: null,
}

type ConnectOptions = {
  logger?: null
  dbUri: string
  mongooseDebug?: boolean
}

function _getMongoOptionsWithoutDbUri(options: ConnectOptions) {
  const { mongooseDebug } = options
  return { ...standardOptions, mongooseDebug }
}

/**
 * @returns {boolean}
 *      True if default connection to MongoDB is currently established
 */
export function isOk() {
  return Global.isConnected === true
}

function getLogger(logger = kthLog) {
  return logger.child({ package: '@kth/mongo' })
}

export async function connect(options: ConnectOptions) {
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
    const data = await mongoose.connect(dbUri, dbOptions)
    log.debug(`DATABASE connected: ${data.connection.host}@${data.connection.name}`)
  } catch (err) {
    log.error('DATABASE:', err && err.reason ? err.reason : err)
    return null
  }
}
