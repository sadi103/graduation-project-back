const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const apppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  date: { type: mongoose.Schema.Types.Date, required: true }
})

apppointmentSchema.set('toJSON', {
  transform: (document , returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

apppointmentSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Appointment', apppointmentSchema)