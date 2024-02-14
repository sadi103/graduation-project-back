const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userShcema = mongoose.Schema({
  name: { type: String, required: true, minLength: 2 },
  username: { type: String, required: true, unique: true, minLength: 3 },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
})

userShcema.set('toJSON', {
  transform: (document , returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // The password hash should be deleted
    delete returnedObject.passwordHash
  }
})

userShcema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userShcema)