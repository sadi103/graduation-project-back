const Blog = require('../models/blog')
const User = require('../models/user')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const { default: mongoose } = require('mongoose')

const api = supertest(app)

const getRootUser = async () => {
  const user = await User.findOne({ username: 'root' })
  return user.toJSON()
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)

  // create root user
  const rootUser = new User({
    name: 'Thafer Aboushi',
    username: 'root',
    email: 'thaferaboushi@gmail.com',
    passwordHash
  })

  await rootUser.save()
})

describe('root user tries to make a blog', () => {
  test('root user has logged in', async () => {
    const root = await getRootUser()

    const userData = await api
      .post('/api/login')
      .send({ username: root.username, password: 'sekret' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtBeggining = await Blog.find({})

    const newBlog = {
      title: 'this a test blog',
      body: 'just testing out hear'
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${userData.body.token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await Blog.find({})
    expect(blogsAtEnd).toHaveLength(blogsAtBeggining.length + 1)
  })

  test('not logged in user with fake token', async () => {

    const blogsAtBeggining = await Blog.find({})

    const newBlog = {
      title: 'this a test blog',
      body: 'just testing out hear'
    }

    // providing a fake token
    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer giorengioaer4q3wet5489rthgsiodfnv')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await Blog.find({})
    expect(blogsAtEnd).toHaveLength(blogsAtBeggining.length)
  })

})

describe('other user tries to make a blog', () => {
  test('other has logged in', async () => {

    const blogsAtBeggining = await Blog.find({})
    const usersAtBeggining = await usersInDb()

    const newUser = {
      name: 'new user',
      username: 'new',
      email: 'newuser@gmail.com',
      password: 'new password'
    }

    const userData = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    console.log('this is userData', userData.body)

    console.log('this is the user\'s token', userData.body.token)

    const newBlog = {
      title: 'this a blog created by the new user',
      body: 'just testing if a user other than root can create a blog'
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${userData.body.token}`)
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await Blog.find({})
    const usersAtEnd = await usersInDb()

    expect(userData.body.username).toBe('new')
    expect(userData.body.name).toBe('new user')
    expect(blogsAtEnd).toHaveLength(blogsAtBeggining.length)
    expect(usersAtEnd).toHaveLength(usersAtBeggining.length + 1)
  })

})

afterAll(async () => {
  await mongoose.connection.close()
})