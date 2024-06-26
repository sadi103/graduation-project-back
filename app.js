const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('express-async-errors')
const usersRouter = require('./controllers/users')
const blogRouter = require('./controllers/blogs')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const loginRouter = require('./controllers/login')
const appointmentRouter = require('./controllers/appointments')

mongoose.set('strictQuery', false)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB: ', error.message)
  })

app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use(middleware.requestLogger)

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/blogs', blogRouter)
app.use('/api/appointments', appointmentRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app