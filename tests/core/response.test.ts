import { initAppAndTest } from '../util.ts'
import { describe, it, run } from 'https://deno.land/x/tincan@1.0.1/mod.ts'

describe('Response properties', () => {
  it('should have default HTTP Response properties', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.status(200).json({
        statusCode: res._init.status,
        chunkedEncoding: false,
      })
    })

    const res = await fetch('/')
    res.expect({
      statusCode: 200,
      chunkedEncoding: false,
    })
  })
})

describe('Response methods', () => {
  it('res.json stringifies the object', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.json({ hello: 'world' })
    })

    const res = await fetch('/')

    res.expect({ hello: 'world' })
  })
  it('res.send sends plain text data', async () => {
    const { fetch } = initAppAndTest(async (_req, res) => {
      await res.send('Hello world')
    })

    const res = await fetch('/')

    res.expect('Hello world')
  })
  it('res.send falls back to res.json when sending objects', async () => {
    const { fetch } = initAppAndTest(async (_req, res) => {
      await res.send({ hello: 'world' })
    })

    const res = await fetch('/')

    res.expect({ hello: 'world' })
  })
  it('res.status sends status', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.status(418).end()
    })

    const res = await fetch('/')
    res.expect(418)
  })
  it('res.sendStatus sends status + text', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.sendStatus(418)
    })
    const res = await fetch('/')
    res.expectStatus(418).expectBody('Im A Teapot')
  })
  it('res.location sends "Location" header', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.location('example.com').end()
    })
    const res = await fetch('/')
    res.expect('Location', 'example.com')
  })
  it('res.set sets headers', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.set('X-Header', 'Hello World').end()
    })
    const res = await fetch('/')
    res.expect('X-Header', 'Hello World')
  })
  it('res.send sets proper headers', async () => {
    const { fetch } = initAppAndTest(async (_req, res) => {
      await res.send({ hello: 'world' })
    })
    const res = await fetch('/')

    res.expect('Content-Type', 'application/json')
  })
  it('res.links sends links', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res
        .links({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5',
        })
        .end()
    })

    const res = await fetch('/')

    res
      .expect(
        'Link',
        '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"',
      )
  })
  it('res.cookie sends cookies to client', async () => {
    const { fetch } = initAppAndTest((_req, res) => {
      res.cookie('Hello', 'World').end()
    })
    const res = await fetch('/')
    res.expect('Set-Cookie', 'Hello=World')
  })
  describe('res.type(type)', () => {
    it('should detect MIME type', async () => {
      const { fetch } = initAppAndTest((_req, res) => {
        res.type('html').end()
      })
      const res = await fetch('/')
      res.expect('Content-Type', 'text/html; charset=utf-8')
    })
    it('should detect MIME type by extension', async () => {
      const { fetch } = initAppAndTest((_req, res) => {
        res.type('.html').end()
      })
      const res = await fetch('/')

      res.expect('Content-Type', 'text/html; charset=utf-8')
    })
  })
})

run()
