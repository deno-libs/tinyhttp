import { describe, it, run } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import { InitAppAndTest } from '../util.ts'
import { send, json, sendStatus } from '../../extensions/res/send/mod.ts'

describe('json(body)', () => {
  it('should send a json-stringified reply when an object is passed', async () => {
    const { fetch } = InitAppAndTest((req, res) => json(req, res)({ hello: 'world' }))

    await fetch.get('/').expect({ hello: 'world' })
  })
  it('should set a content-type header properly', async () => {
    const { fetch } = InitAppAndTest((req, res) => json(req, res)({ hello: 'world' }))

    await fetch.get('/').expect('Content-Type', 'application/json')
  })
  it('should send a null reply when an null is passed', async () => {
    const { fetch } = InitAppAndTest((req, res) => json(req, res)(null))

    await fetch.get('/').expect('')
  })
})

describe('send(body)', () => {
  it('should send a plain text', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)('Hello World'))

    await fetch.get('/').expect('Hello World')
  })
  it('should set HTML content-type header when sending plain text', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)('Hello World'))

    await fetch.get('/').expect('Content-Type', 'text/html; charset=utf-8')
  })
  it('should generate an eTag on a plain text response', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)('Hello World'))

    await fetch.get('/').expect('etag', 'W/"b-0a4d55a8d778e5022fab701977c"')
  })
  it('should send a JSON response', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)({ hello: 'world' }))

    await fetch.get('/').expect('Content-Type', 'application/json').expect({ hello: 'world' })
  })
  it('should send nothing on a HEAD request', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)('Hello World'))
    // @ts-ignore
    await fetch.head('/').expect(null)
  })
  it('should send nothing if body is empty', async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)(null))
    // @ts-ignore
    await fetch.get('/').expect(null)
  })
  /* it('should remove some headers for 204 status', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      res.status = 204

      send(req, res)('Hello World')
    })

    await fetch
      .get('/')
      .expect('Content-Length', '')
      .expect('Content-Type', '')
      .expect('Transfer-Encoding', '')
      .expect('')
  })
  it('should remove some headers for 304 status', async () => {
    const { fetch } = InitAppAndTest(
      (req, res) => {
        res.status = 304
        res.headers?.delete('Content-Type')
        send(req, res)('Hello World')
      },
      '/',
      {},
      'get'
    )

    await fetch
      .get('/')
      .expect('Content-Length', '')
      .expect('Content-Type', '')
      .expect('Transfer-Encoding', '')
      .expect('')
  }) */
  /* it("should set Content-Type to application/octet-stream for buffers if the header hasn't been set before", async () => {
    const { fetch } = InitAppAndTest((req, res) => send(req, res)(new TextEncoder().encode('Hello World')).end())

    await fetch.get('/').expect('Content-Type', 'application/octet-stream')
  }) */
})

describe('sendStatus(status)', () => {
  it(`should send "I'm a teapot" when argument is 418`, async () => {
    const { fetch } = InitAppAndTest((req, res) => sendStatus(req, res)(418))

    await fetch.get('/').expect(418, 'Im A Teapot')
  })
})

run()
