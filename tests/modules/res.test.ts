import { describe, it, run } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import { InitAppAndTest } from '../util.ts'
import {
  setHeader,
  getResponseHeader,
  setVaryHeader,
  setContentType,
  setLocationHeader
} from '../../extensions/res/headers.ts'
import { redirect } from '../../extensions/res/redirect.ts'
import { attachment } from '../../extensions/res/download.ts'
import * as path from 'https://deno.land/std@0.98.0/path/mod.ts'

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

run()
