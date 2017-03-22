const mongoose = require('mongoose')
mongoose.Promise = global.Promise

// setup Mongoose connection to mongoDB
module.exports = {
  connect: _connect,
  isOk: _isOk
}

const stdLogger = {
  debug: consoleLogger('debug'),
  info: consoleLogger('info'),
  warn: consoleLogger('warn'),
  error: consoleLogger('error')
}
const RECONNECT_TIMEOUT = 30000

let standardOptions = {
  db: {
    native_parser: true
  },
  server: {
    socketOptions: {
      keepAlive: 1,
      socketTimeoutMS: 0,
      connectTimeoutMS: 0
    },
    ssl: false,
    auto_reconnect: true,
    reconnectInterval: RECONNECT_TIMEOUT
  },
  replset: {
    socketOptions: {
      keepAlive: 1,
      socketTimeoutMS: 0,
      connectTimeoutMS: 0
    }
  },
  logger: stdLogger
}

function consoleLogger (level) {
  return function (file, msg) {
    console.log(new Date().toISOString(), level, file, msg)
  }
}

var isOk
function _isOk () {
  return isOk === true
}

function _connect (options) {
  mongoose.Promise = global.Promise
  var log = options.logger || stdLogger
  // Mongoose connect is called once by the app.js & connection established
  var dbUri = options.dbUri
  var dbOptions = getMongoOptions(options)

  return new Promise((resolve, reject) => {
    mongoose.connect(dbUri, dbOptions)
    log.info('Connect DB: ' + options.dbUri)

    mongoose.connection.on('error', dbErr => {
      log.warn({ err: dbErr.message }, 'DB connection error, retrying in 30 seconds')
      isOk = false
      // disconnect if connection is still open
      mongoose.disconnect().then(() => {
        setTimeout(function () {
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
  })
}

function getMongoOptions (options) {
  var dbOptions = _mergeOptions(standardOptions, options)
  return dbOptions
}

// merge all options objects front to back, i.e. later overriding earlier objects
function _mergeOptions () {
  var options = {}
  for (var i = 0; i < arguments.length; ++i) {
    let obj = arguments[i]
    for (var attr in obj) { options[attr] = obj[attr] }
  }
  return options
}
