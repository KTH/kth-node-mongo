import kthLog from '@kth/log'
import mongoose from 'mongoose'
const standardOptions = {
  ssl: false,
  // keepAlive: true,
  // keepAliveInitialDelay: 0,
  // socketTimeoutMS: 0,
  // serverSelectionTimeoutMS: 5000,
  // heartbeatFrequencyMS: 5000,
}

let isConnected = false

type ConnectOptions = {
  logger?: null
  dbUri: string
  mongooseDebug?: boolean
  user: string
  pass: string
  ssl?: boolean
}

function _getMongoOptionsWithoutDbUri(options: ConnectOptions) {
  const { mongooseDebug, user, pass, ssl } = options
  return { ...standardOptions, mongooseDebug, user, pass, ssl }
}

// True if default connection to MongoDB is currently established
export function isOk() {
  return isConnected === true
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
      isConnected = true
    })

    mongoose.connection.on('reconnected', () => {
      log.info('DATABASE: Default connection re-established')
      isConnected = true
    })

    mongoose.connection.on('disconnected', () => {
      log.warn('DATABASE: Default connection lost')
      isConnected = false
    })

    mongoose.connection.on('error', error => {
      log.fatal('DATABASE: Connection error', { error })
      isConnected = false
    })
    return mongoose.connect(dbUri, dbOptions).then(data => {
      log.debug(`DATABASE connected: ${data.connection.host}@${data.connection.name}`)
    })
  } catch (e) {
    log.error('DATABASE:', e)
    return null
  }
}
