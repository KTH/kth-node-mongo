# kth-node-mongo
[![Build Status](https://travis-ci.org/KTH/kth-node-mongo.svg?branch=master)](https://travis-ci.org/KTH/kth-node-mongo)
Database connection wrapping Mongoose (for MongoDB)

This module connects to mongoDB using Mongoose default connection.

To use this module

## Connect to database

1. Import module  
    const nodeMongo =require('kth-node-mongo')

1. Connect to mongoDB over SSL: 
    nodeMongo.connect(options, sslOptions) or

1. Connect to mongoDB without SSL: 
    nodeMongo.connect(options)

1. Use Mongoose schema and model to interact with mongoDB

Function connect() returns a promise to be resolved upon completed connection or rejected on error.



### Options

*  **dbUsername** (required)
    Credentials, the database user
  
*  **dbPassword** (required)
    Credentials, the password for the database user
  
*  **dbUri** (required)
    The URI for the mongoDb to connect to
  
*  **logger** (optional)
    A logger to use, defaults to stdout(console.log)
    
*   **reconnectTries** (optional)
    Max attempts to reconnect to mongoDB if connection is lost, defaults to 1000

*   **reconnectInterval** (optional)
    Time between reconnect attempts in milliseconds, defaults to 30000

### SSL(TLS) Options

*  **ssl** (optional)
    Boolean flag if database connection shoold be encrypted or not
  
*  **authDatabase** (optional)
    If login credentials are used, specifies which database to use for authentication of user. Can also be sent as part of dbUri.
  
*  **caCerts** (optional)
    A list of buffers or strings containing the ca certificates (.pem) we accept when setting up the secure connetion.


Example without secure database connction

    nodeMongo.connect({
      dbUsername: 'user',
      dbPassword: 'himligt',
      dbUri: 'mongodb://localhost/le_database?authSource=authDB',
      logger: log
    })
    .then(() => log.debug('Connected to Mongo'))
    .catch((err) => log.error(err))

Example with secure database connction

    nodeMongo.connect({
      dbUsername: 'user',
      dbPassword: 'himligt',
      dbUri: 'mongodb://localhost/le_database',
      logger: log
    },
    {
      ssl: true,
      authenticationDatabase: 'authDB',
      sslCA: certs
    })
    .then(() => log.debug('Connected to Mongo'))
    .catch((err) => log.error(err))

## Check status of connection

1. Import module  
    const nodeMongo =require('kth-node-mongo')

1. Check connection: 
    if (nodeMongo.isOk()) {
        // OK
    } else {
        // ERROR
    }


