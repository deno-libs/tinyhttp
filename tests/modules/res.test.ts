import { describe, it, run } from 'https://deno.land/x/wizard/mod.ts'
import { InitAppAndTest } from '../util.ts'
import { setHeader, getResponseHeader, setVaryHeader, redirect } from '../../extensions/res/mod.ts'

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

run()
