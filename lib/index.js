/* eslint no-use-before-define: ["error", "nofunc"] */

// @ts-check

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

// setup Mongoose connection to mongoDB
module.exports = {
  connect: _connect,
  isOk: _isOk,
}

const stdLogger = {
  debug: consoleLogger('debug'),
  info: consoleLogger('info'),
  warn: consoleLogger('warn'),
  error: consoleLogger('error'),
}
const RECONNECT_TIMEOUT = 30000

const standardOptions = {
  keepAlive: 1,
  socketTimeoutMS: 0,
  connectTimeoutMS: 0,
  ssl: false,
  autoReconnect: true,
  reconnectTries: 30,
  reconnectInterval: RECONNECT_TIMEOUT,
  useNewUrlParser: true,
  logger: stdLogger,
}

function consoleLogger(level) {
  return (file, msg) => {
    // eslint-disable-next-line no-console
    console.log(new Date().toISOString(), level, file, msg)
  }
}

let isOk
function _isOk() {
  return isOk === true
}

function _connect(options) {
  const log = options.logger || stdLogger
  // Mongoose connect is called once by the app.js & connection established
  const { dbUri } = options
  delete options.dbUri
  const dbOptions = getMongoOptions(options)

  return new Promise(resolve => {
    mongoose.connection.on('error', dbErr => {
      log.warn({ err: dbErr.message }, 'DB connection error, retrying in 30 seconds')
      isOk = false
      // disconnect if connection is still open
      mongoose.disconnect(() => {
        setTimeout(() => {
          mongoose.connect(dbUri, dbOptions)
          log.info('Attempting to reconnect')
        }, options.reconnectInterval || RECONNECT_TIMEOUT)
      })
    })

    mongoose.connection.on('connected', () => {
      log.info('DB connection connected')
      isOk = true
      resolve(true)
    })

    mongoose.connection.on('disconnected', () => {
      log.info('DB connection disconnected')
      isOk = false
    })

    mongoose.connection.on('reconnected', () => {
      log.info('DB connection reconnected')
      isOk = true
    })

    mongoose.connect(dbUri, dbOptions)
  })
}

function getMongoOptions(options) {
  const dbOptions = _mergeOptions(standardOptions, options)
  return dbOptions
}

// merge all options objects front to back, i.e. later overriding earlier objects
function _mergeOptions(...args) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    Object.assign(options, args[i])
  }
  return options
}
