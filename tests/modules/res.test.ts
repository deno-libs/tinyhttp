import { describe, it, run, expect } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import { InitAppAndTest, runServer } from '../util.ts'
import {
  setHeader,
  getResponseHeader,
  setVaryHeader,
  setContentType,
  setLocationHeader
} from '../../extensions/res/headers.ts'
import { redirect } from '../../extensions/res/redirect.ts'
import { formatResponse } from '../../extensions/res/format.ts'
import { attachment } from '../../extensions/res/download.ts'
import { setCookie } from '../../extensions/res/cookie.ts'
import * as path from 'https://deno.land/std@0.101.0/path/mod.ts'
import type { Request } from '../../request.ts'

const __dirname = new URL('.', import.meta.url).pathname

describe('res.set(field, val)', () => {
  it('should set a string header with a string value', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('hello', 'World')
      res.end()
    })

    await fetch.get('/').expect('hello', 'World')
  })
  it('should set an array of header values', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('foo', ['bar', 'baz'])
      res.end()
    })

    await fetch.get('/').expect('foo', 'bar,baz')
  })
  it('should throw if `Content-Type` header is passed as an array', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      try {
        setHeader(res)('content-type', ['foo', 'bar'])
      } catch (e) {
        res.status = 500
        res.end((e as TypeError).message)
      }
    })
    await fetch.get('/').expect(500, 'Content-Type cannot be set to an Array')
  })
  it('if the first argument is object, then map keys to values', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)({ foo: 'bar' })
      res.end()
    })

    await fetch.get('/').expect('foo', 'bar')
  })
  it('should not set a charset of one is already set', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('content-type', 'text/plain; charset=UTF-8')
      res.end()
    })

    await fetch.get('/').expect('content-type', 'text/plain; charset=UTF-8')
  })
})

describe('res.get(field)', () => {
  it('should get a header with a specified field', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('hello', 'World')
      res.end(getResponseHeader(res)('hello'))
    })

    await fetch.get('/').expect('World')
  })
})

describe('res.vary(field)', () => {
  it('should set a "Vary" header properly', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setVaryHeader(res)('User-Agent').end()
    })

    await fetch.get('/').expect('Vary', 'User-Agent')
  })
})

describe('res.redirect(url, status)', () => {
  it('should set 302 status and message about redirecting', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      redirect(req, res, () => {})('/abc')
    })

    await fetch.get('/').expect('Location', '/abc').expect(302 /*  'Redirecting to' */)
  })

  it('should send an HTML link to redirect to', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      if (req.url === '/abc') {
        req.respond({
          status: 200,
          body: 'Hello World'
        })
      } else {
        redirect(req, res, () => {})('/abc')
      }
    })

    await fetch
      .get('/')
      .set('Accept', 'text/html')
      .expect(302 /* '<p>Found. Redirecting to <a href="/abc">/abc</a></p>' */)
  })
})

describe('res.format(obj)', () => {
  /*  it('should send text by default', async () => {
    const request = runServer((req, res) => {
      formatResponse(req, res, () => {})({
        text: (req: Request) => req.respond({ body: `Hello World` })
      }).end()
    })

    await request.get('/').expect(200).expect('Hello World')
  }) */
  /* it('should send HTML if specified in "Accepts" header', async () => {
    const request = runServer((req, res) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      formatResponse(req, res, () => {})({
        text: (req: Request) => req.respond({ body: `Hello World` }),
        html: (req: Request) => req.respond({ body: '<h1>Hello World</h1>' })
      }).end()
    })

    await request
      .get('/')
      .set('Accept', 'text/html')
      .expect(200, '<h1>Hello World</h1>')
      .expect('Content-Type', 'text/html')
  }) */
  it('should throw 406 status when invalid MIME is specified', async () => {
    const request = runServer((req, res) => {
      formatResponse(req, res, (err) => {
        res.status = err.status
        res.send(err.message)
      })({
        text: (req: Request) => req.respond({ body: `Hello World` })
      }).end()
    })

    await request.get('/').set('Accept', 'foo/bar').expect(406)
  })
  it('should call `default` as a function if specified', async () => {
    const request = runServer((req, res) => {
      formatResponse(req, res, () => {})({
        default: () => res.end('Hello World')
      }).end()
    })

    await request.get('/').expect(200)
  })
})

describe('res.type(type)', () => {
  it('should detect MIME type', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setContentType(res)('html').end()
    })

    await fetch.get('/').expect('Content-Type', 'text/html; charset=utf-8')
  })
  it('should detect MIME type by extension', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setContentType(res)('.html').end()
    })

    await fetch.get('/').expect('Content-Type', 'text/html; charset=utf-8')
  })
})

describe('res.attachment(filename)', () => {
  it('should set Content-Disposition without a filename specified', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      attachment(res)().end()
    })

    await fetch.get('/').expect('Content-Disposition', 'attachment')
  })
  it('should set Content-Disposition with a filename specified', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      attachment(res)(path.join(__dirname, '../fixtures', 'favicon.ico')).end()
    })

    await fetch.get('/').expect('Content-Disposition', 'attachment; filename="favicon.ico"')
  })
})

/* describe('res.download(filename)', () => {
  it('should set Content-Disposition based on path', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      download(req, res)(path.join(__dirname, '../fixtures', 'favicon.ico'))
    })

    await fetch
      .get('/')
      .expect('Content-Disposition', 'attachment; filename="favicon.ico"')
      .expect('Content-Encoding', 'utf-8')
  })
  it('should set Content-Disposition based on filename', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      download(req, res)(path.join(__dirname, '../fixtures', 'favicon.ico'), 'favicon.icon')
    })

    await fetch.get('/').expect('Content-Disposition', 'attachment; filename="favicon.icon"')
  })

  it('should set "root" from options', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      download(req, res)('favicon.ico', undefined, {
        root: path.join(__dirname, '../fixtures')
      })
    })

    await fetch.get('/').expect('Content-Disposition', 'attachment; filename="favicon.ico"')
  })
  it(`should pass options to sendFile`, async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      download(req, res)(path.join(__dirname, '../fixtures', 'favicon.ico'), undefined, {
        encoding: 'ascii'
      })
    })

    await fetch.get('/').expect('Content-Disposition', 'attachment; filename="favicon.ico"')
  })
  it('should set headers from options', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      download(req, res)(path.join(__dirname, '../fixtures', 'favicon.ico'), undefined, {
        headers: {
          'X-Custom-Header': 'Value'
        }
      })
    })

    await fetch
      .get('/')
      .expect('Content-Disposition', 'attachment; filename="favicon.ico"')
      .expect('X-Custom-Header', 'Value')
  })
})
 */

describe('res.location(url)', () => {
  it('sets the "Location" header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      setLocationHeader(req, res)('https://example.com').end()
    })

    await fetch.get('/').expect('Location', 'https://example.com').expect(200)
  })
  it('should encode URL', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      setLocationHeader(req, res)('https://google.com?q=\u2603 §10').end()
    })

    await fetch.get('/').expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710').expect(200)
  })
  it('should not touch encoded sequences', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      setLocationHeader(req, res)('https://google.com?q=%A710').end()
    })

    await fetch.get('/').expect('Location', 'https://google.com?q=%A710').expect(200)
  })
})

describe('res.cookie(name, value, options)', () => {
  it('serializes the cookie and puts it in a Set-Cookie header', async () => {
    const request = runServer((req, res) => {
      setCookie(req, res)('hello', 'world').end()

      expect(res.headers.get('Set-Cookie')).toBe('hello=world; Path=/')
    })

    await request.get('/').expect(200)
  })
  it('sets default path to "/" if not specified in options', async () => {
    const request = runServer((req, res) => {
      setCookie(req, res)('hello', 'world').end()

      expect(res.headers.get('Set-Cookie')).toContain('Path=/')
    })

    await request.get('/').expect(200)
  })
  /* it('should throw if it is signed and and no secret is provided', async () => {
    const app = runServer((req, res) => {
      try {
        setCookie(req, res)('hello', 'world', {
          signed: true
        }).end()
      } catch (e) {
        res.end((e as TypeError).message)
      }
    })

    await makeFetch(app)('/').expect('cookieParser("secret") required for signed cookies')
  }) */
  it('should set "maxAge" and "expires" from options', async () => {
    const maxAge = 3600 * 24 * 365

    const request = runServer((req, res) => {
      setCookie(req, res)('hello', 'world', {
        maxAge
      }).end()

      expect(res.headers.get('Set-Cookie')).toContain(`Max-Age=${maxAge / 1000}; Path=/; Expires=`)
    })

    await request.get('/').expect(200)
  })
  it('should append to Set-Cookie if called multiple times', async () => {
    const request = runServer((req, res) => {
      setCookie(req, res)('hello', 'world')
      setCookie(req, res)('foo', 'bar').end()
    })

    await request.get('/').expect(200).expect('Set-Cookie', 'hello=world, foo=bar')
  })
})

run()
