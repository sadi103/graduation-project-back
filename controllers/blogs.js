const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('Authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

const getRootUser = async () => {
  const user = await User.findOne({ username: 'root' })
  return user.toJSON()
}

blogRouter.post('/', async (request, response) => {
  const { title, body, image } = request.body

  // extracting the user info from the token 
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)

  // the token info should contain an id
  if (!decodedToken.id) {
    return response .status(401).json({ error: 'token invalid' })
  }

  const rootUser = await getRootUser()

  // make sure that the id and username in the token belong to the root user, else fire an error
  if ((decodedToken.username !== 'root') || (decodedToken.id !== rootUser.id)) {
    return response.status(401).json({ error: 'only root user is allowed to create blogs' })
  }

  // create blog and save it
  const newBlog = new Blog({ title, body, image })
  await newBlog.save()

  response.status(201).end()
})

module.exports = blogRouter