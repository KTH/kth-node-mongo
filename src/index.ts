import kthLog from '@kth/log'
import mongoose, { type ConnectOptions } from 'mongoose'

let isConnected = false

// True if default connection to MongoDB is currently established
export function isOk() {
  return isConnected === true
}

function getLogger(logger = kthLog) {
  return logger.child({ package: '@kth/mongo' })
}

export async function connect(
  dbUri: string,
  connectOptions: ConnectOptions,
  logger: any,
  debug = false
) {
  const log = getLogger(logger)

  try {
    log.info('DATABASE: Connecting database...')

    if (debug) {
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
    return mongoose.connect(dbUri, connectOptions).then(data => {
      log.debug(`DATABASE connected: ${data.connection.host}@${data.connection.name}`)
    })
  } catch (e) {
    log.error('DATABASE:', e)
    return null
  }
}
