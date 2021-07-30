import { describe, it, run, beforeAll, afterAll, expect } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import * as path from 'https://deno.land/std@0.103.0/path/mod.ts'
import * as fs from 'https://deno.land/std@0.103.0/node/fs.ts'
import { runServer } from '../util.ts'
import { send, json, sendStatus, sendFile } from '../../extensions/res/send/mod.ts'

const __dirname = new URL('.', import.meta.url).pathname

describe('json(body)', () => {
  it('should send a json-stringified reply when an object is passed', async () => {
    const request = runServer((req, res) => json(req, res)({ hello: 'world' }))

    await request.get('/').expect({ hello: 'world' })
  })
  it('should set a content-type header properly', async () => {
    const request = runServer((req, res) => json(req, res)({ hello: 'world' }))

    await request.get('/').expect('content-type', 'application/json')
  })
  it('should send a null reply when an null is passed', async () => {
    const request = runServer((req, res) => json(req, res)(null))

    // @ts-ignore
    await request.get('/').expect(null)
  })
})
describe('send(body)', () => {
  it('should send a plain text', async () => {
    const request = runServer((req, res) => send(req, res)('Hello World'))

    await request.get('/').expect('Hello World')
  })
  it('should set HTML content-type header when sending plain text', async () => {
    const request = runServer((req, res) => send(req, res)('Hello World'))

    await request.get('/').expect('Content-Type', 'text/html; charset=utf-8')
  })
  it('should generate an eTag on a plain text response', async () => {
    const request = runServer((req, res) => send(req, res)('Hello World'))

    await request.get('/').expect('etag', 'W/"b-0a4d55a8d778e5022fab701977c"')
  })
  it('should send a JSON response', async () => {
    const request = runServer((req, res) => send(req, res)({ hello: 'world' }))

    await request.get('/').expect('Content-Type', 'application/json').expect({ hello: 'world' })
  })
  it('should send nothing on a HEAD request', async () => {
    const request = runServer((req, res) => send(req, res)('Hello World'))

    // @ts-ignore
    await request.head('/').expect(null)
  })
  it('should send nothing if body is empty', async () => {
    const request = runServer((req, res) => send(req, res)(null))

    // @ts-ignore
    await request.get('/').expect(null)
  })
  it('should remove some headers for 204 status', async () => {
    const request = runServer((req, res) => {
      res.status = 204

      send(req, res)('Hello World')
    })

    // @ts-ignore
    await request.get('/').expect(204)
  })
  it('should remove some headers for 304 status', async () => {
    const request = runServer((req, res) => {
      res.status = 304

      send(req, res)('Hello World')
    })

    await request.get('/')
  })
  it("should set Content-Type to application/octet-stream for buffers if the header hasn't been set before", async () => {
    const enc = new TextEncoder()
    const body = enc.encode('Hello World')
    const request = runServer((req, res) => send(req, res)(body))

    await request.get('/').expect('Content-Type', 'application/octet-stream')
  })
  it('should set 304 status for fresh requests', async () => {
    const etag = 'abc'

    const request = runServer((_req, res) => {
      const str = Array(1000).join('-')
      res.set('ETag', etag).send(str)
    })

    await request.get('/').set('If-None-Match', etag).expect(304)
  })
})

describe('sendStatus(status)', () => {
  it(`should send "I'm a teapot" when argument is 418`, async () => {
    const request = runServer((req, res) => sendStatus(req, res)(418).end())

    await request.get('/').expect(418)
  })
})

describe('sendFile(path)', () => {
  const testFilePath = path.resolve(__dirname, 'test.txt')

  beforeAll(() => {
    fs.writeFileSync(testFilePath, 'Hello World')
  })

  afterAll(() => {
    fs.unlinkSync(testFilePath)
  })

  /* it('should send the file', async () => {
    const request = runServer((req, res) => sendFile(req, res)(testFilePath, {}))

    await request.get('/').expect('Hello World')
  }) */

  it('should throw if path is not absolute', async () => {
    const request = runServer((req, res) => {
      try {
        sendFile(req, res)('../relative/path', {})
      } catch (err) {
        expect(err.message).toMatch(/absolute/)

        res.end()

        return
      }

      throw new Error('Did not throw an error')
    })

    await request.get('/')
  })
  /* it('should set the Content-Type header based on the filename', async () => {
    const request = runServer((req, res) => sendFile(req, res)(testFilePath, {}))

    await request.get('/').expect('Content-Type', 'text/plain; charset=utf-8')
  }) */
  /*   it('should allow custom headers through the options param', async () => {
    const HEADER_NAME = 'Test-Header'
    const HEADER_VALUE = 'Hello World'

    const request = runServer((req, res) =>
      sendFile(req, res)(testFilePath, { headers: { [HEADER_NAME]: HEADER_VALUE } })
    )

    await request.get('/').expect(HEADER_NAME, HEADER_VALUE)
  }) */

  /*  it('should support Range header', async () => {
    const request = runServer((req, res) => sendFile(req, res)(testFilePath))
    await request
      .get('/')
      .set('Range', 'bytes=0-4')
      .expect(206)
      .expect('Content-Length', '5')
      .expect('Accept-Ranges', 'bytes')
      .expect('Hello')
  }) */
  // it('should send 419 if out of range', async () => {
  //   const request = runServer((req, res) => sendFile(req, res)(testFilePath))

  //   await request.get('/').set('Range', 'bytes=0-666').expect(416).expect('Content-Range', 'bytes */11')
  // })
  // it('should set default encoding to UTF-8', async () => {
  //   const request = runServer((req, res) => sendFile(req, res)(testFilePath))
  //   await request.get('/').expect(200).expect('Content-Encoding', 'utf-8')
  // })
})

run()
