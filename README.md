# @kth/mongo

Database connection wrapping Mongoose (for MongoDB)

This module connects to mongoDB using Mongoose default connection.

To use this module

## Connect to database

1. Import module  
   const nodeMongo =require(@kth/mongo')

1. Connect to mongoDB :
   nodeMongo.connect(options)

1. Use Mongoose schema and model to interact with mongoDB

Function connect() returns a promise to be resolved upon completed connection or rejected on error.

### Options

- **dbUsername** (required)
  Credentials, the database user

- **dbPassword** (required)
  Credentials, the password for the database user

- **dbUri** (required)
  The URI for the mongoDb to connect to

- **logger** (optional)
  A logger to use, defaults to stdout(console.log)

### SSL(TLS) Options

- **ssl** (optional)
  Boolean flag if database connection shoold be encrypted or not

Example without secure database connction

```js
nodeMongo
  .connect({
    dbUsername: 'user',
    dbPassword: 'himligt',
    dbUri: 'mongodb://localhost/le_database?authSource=authDB',
    logger: log,
  })
  .then(() => log.debug('Connected to Mongo'))
  .catch(err => log.error(err))
```

Example with secure database connction

```js
nodeMongo
  .connect({
    dbUsername: 'user',
    dbPassword: 'himligt',
    dbUri: 'mongodb://localhost/le_database',
    logger: log,
    ssl: true,
  })
  .then(() => log.debug('Connected to Mongo'))
  .catch(err => log.error(err))
```

## Check status of connection

1. Import module  
   const nodeMongo =require('@kth/mongo')

1. Check connection:

   ```js
   if (nodeMongo.isOk()) {
     // OK
   } else {
     // ERROR
   }
   ```
