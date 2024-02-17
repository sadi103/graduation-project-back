const bcrypt = require('bcrypt')
const User = require('../models/user')
const supertest = require('supertest')
const app = require('../app')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const api = supertest(app)

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const getRootUser = async () => {
  const user = await User.findOne({ username: 'root' })
  return user.toJSON()
}

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ name: 'Thafer Aboushi', username: 'root', email: 'tfraboushi@gmail.com', passwordHash })

  await user.save()
})

describe('when there is initially one user in db', () => {

  test('creation doesn\'t succeeds with a fresh username because password isn\'t strong', async () => {
    const usersAtStart = await usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      email: 'mluukai@gmail.com',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).not.toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await usersInDb()

    const newUser = {
      name: 'Superuser',
      username: 'root',
      email: 'www@gmail.com',
      password: 'Salainen324!!',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('create user with password shorter than 3 characters', async () => {
    const usersAtBegging = await usersInDb()

    const newUser = {
      name: 'dummy user',
      username: 'dummy',
      email: 'www@dummy.com',
      password: 'sa',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Password not strong enough')

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtBegging.length)
  })

  test('password or username missing', async () => {
    const usersAtBegging = await usersInDb()

    const newUser = {
      // username: 'dummy',
      name: 'dummy user'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('All fields must be')

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtBegging.length)
  })

  test('root user tries to login', async () => {
    const rootUser = {
      username: 'root',
      password: 'sekret',
    }

    const userData = await api
      .post('/api/login')
      .send(rootUser)
      .expect(200)

    const decodedToken = jwt.verify(userData.body.token, process.env.SECRET)
    const user = await getRootUser()
    expect({ id: decodedToken.id, username: decodedToken.username }).toEqual({ username: 'root', id: user.id })
  })

  test('unregistered user tries to login', async () => {

    const unregisteredUser = {
      username: 'mluukkai',
      password: 'salainen',
    }

    const response = await api
      .post('/api/login')
      .send(unregisteredUser)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toBe('invalid username or password')
  })

})

afterAll(() => {
  mongoose.connection.close()
})