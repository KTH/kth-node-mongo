const mongoose = require('mongoose')

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

function consoleLogger (level) {
  return function (file, msg) {
    console.log(new Date().toISOString(), level, file, msg)
  }
}

var isOk
function _isOk () {
  return isOk === true
}

function _connect (options, sslOptions) {
  mongoose.Promise = global.Promise
  var log = options.logger || stdLogger
  // Mongoose connect is called once by the app.js & connection established
  var dbUri = options.dbUri
  var dbOptions
  if (typeof sslOptions === 'object') {
    dbOptions = getMongoOptionsSsl(options, sslOptions)
  } else {
    dbOptions = getMongoOptions(options)
  }

  return new Promise((resolve, reject) => {
    mongoose.connect(dbUri, dbOptions)
    log.info('Connect DB: ' + options.dbUri)

    mongoose.connection.on('error', dbErr => {
      log.warn({ err: dbErr }, 'DB connection error')
      isOk = false
      reject(dbErr)
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
  var dbOptions = {
    db: {
      native_parser: true
    },
    server: {
      socketOptions: {
        keepAlive: 1
      }
    },
    reconnectTries: options.reconnectTries || 1000,
    reconnectInterval: options.reconnectInterval || 30000,
    replset: {
      socketOptions: {
        keepAlive: 1
      }
    },
    user: options.dbUsername,
    pass: options.dbPassword
  }

  return dbOptions
}

function getMongoOptionsSsl (options, sslOptions) {
  var dbOptions = {
    db: {
      native_parser: true
    },
    server: {
      socketOptions: {
        keepAlive: 1
      },
      ssl: sslOptions.ssl,
      authenticationDatabase: sslOptions.authDatabase,
      sslCA: sslOptions.sslCA
    },
    reconnectTries: options.reconnectTries || 1000,
    reconnectInterval: options.reconnectInterval || 30000,
    replset: {
      socketOptions: {
        keepAlive: 1
      }
    },
    user: options.dbUsername,
    pass: options.dbPassword
  }

  return dbOptions
}
