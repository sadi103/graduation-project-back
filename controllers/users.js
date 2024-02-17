const usersRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('validator')

usersRouter.post('/', async (request, response) => {
  const { name, username, email, password } = request.body

  // validation
  if (!password || !username || !name || !email) {
    throw Error('All fields must be filled')
  }
  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }
  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  // If anything goes wrong validation error will be triggered and user will not be created
  const user = User({
    name,
    username,
    email,
    passwordHash,
  })

  const savedUser = await user.save()

  const userForToken = {
    username: savedUser.username,
    id: savedUser.id
  }

  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60 }
  )

  return response.status(201).json({ token, username: savedUser.username, name: savedUser.name })


  // if (password && username && name && email) {
  //   if (password.length < 3) {
  //     throw Error('password too short, at least enter 3 characters')
  //   }
  
  //   const saltRounds = 10
  //   const passwordHash = await bcrypt.hash(password, saltRounds)

  //   // If anything goes wrong validation error will be triggered and user will not be created
  //   const user = User({
  //     name,
  //     username,
  //     email,
  //     passwordHash,
  //   })

  //   const savedUser = await user.save()

  //   const userForToken = {
  //     username: savedUser.username,
  //     id: savedUser.id
  //   }

  //   const token = jwt.sign(
  //     userForToken,
  //     process.env.SECRET,
  //     { expiresIn: 60*60 }
  //   )

  //   return response.status(201).json({ token, username: savedUser.username, name: savedUser.name })
  // }

  // // For triggering validation error
  // const emptyUser = new User({
  //   name,
  //   username,
  //   email,
  //   password
  // })

  // await emptyUser.save()
})

module.exports = usersRouter