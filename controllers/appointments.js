const Appointment = require('../models/appointment')
const appointmentRouter = require('express').Router()
const jwt = require('jsonwebtoken')

const getToken = header => {
  return header.split(' ')[1]
}

appointmentRouter.post('/', async (request, response) => {
  const { date } = request.body

  const token = getToken(request.get('Authorization'))
  const decodedToken = jwt.verify(token, process.env.SECRET)

  const userId = decodedToken.id
  const newAppointment = Appointment({ userId, date })
  
  const savedAppointment = await newAppointment.save()

  const appointment = await Appointment.find({ _id: savedAppointment._id.toString() }).populate('userId')

  return response.status(201).json(appointment)
})

appointmentRouter.get('/', async (request, response) => {
  const token = getToken(request.get('Authorization'))

  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (decodedToken.username === 'root') {
    const appointments = await Appointment.find({}).populate('userId')
    return response.status(200).json(appointments)
  } else {
    const appointment = await Appointment.find({ userId: decodedToken.id }).populate('userId')
    return response.status(200).json(appointment)
  }
})

appointmentRouter.delete('/:id', async (request, response) => {
  const appointmentId = request.params.id
  const token = getToken(request.get('Authorization'))

  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const appointment = await Appointment.findOne({ _id: appointmentId })

  if ((decodedToken.id !== appointment.userId.toString()) && (decodedToken.username !== 'root')) {
    return response.status(401).end()
  }

  const deletedAppointment = await Appointment.deleteOne({ _id: appointmentId })

  return response.status(201).json(deletedAppointment)
})

module.exports = appointmentRouter