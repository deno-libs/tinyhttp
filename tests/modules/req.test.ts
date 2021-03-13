import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { InitAppAndTest } from '../util.ts'
import { Ranges } from '../../types.ts'
import {
  checkIfXMLHttpRequest,
  getFreshOrStale,
  getRequestHeader,
  getAccepts,
  getAcceptsEncodings,
  getRangeFromHeader
} from '../../extensions/req/mod.ts'

describe('req.get(header)', () => {
  it('should return a specified header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      res.end(getRequestHeader(req)('accept'))
    })

    await fetch.get('/').expect('*/*')
  })
  it('should handle referrer "r"s', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      res.end(getRequestHeader(req)('referrer'))
    })

    await fetch.get('/').set('referer', 'localhost:3000').set('Referrer-Policy', 'unsafe-url').expect('localhost:3000')
  })
})
describe('req.xhr', () => {
  it('should be false in node environment', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      res.end(`Browser request: ${checkIfXMLHttpRequest(req) ? 'yes' : 'no'}`)
    })
    await fetch.get('/').expect('Browser request: no').expect('Browser request: no')
  })
})

describe('req.fresh', () => {
  it('returns false if method is neither GET nor HEAD', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const fresh = getFreshOrStale(req, res)

      res.end(fresh ? 'fresh' : 'stale')
    })

    await fetch.get('/').send('Hello World').expect('stale')
  })
  it('returns false if status code is neither >=200 nor < 300, nor 304', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      res.status = 418

      const fresh = getFreshOrStale(req, res)

      res.end(fresh ? 'fresh' : 'stale')
    })

    await fetch.get('/').expect('stale')
  })
})

describe('req.accepts()', () => {
  it('should detect an "Accept" header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const accepts = getAccepts(req)()

      res.send(Array.isArray(accepts) ? accepts[0] : accepts)
    })

    await fetch.get('/').set('Accept', 'text/plain').expect('text/plain')
  })
  it('should parse multiple values', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const accepts = getAccepts(req)()

      res.end((accepts as string[]).join(' | '))
    })

    await fetch.get('/').set('Accept', 'text/plain, text/html').expect('text/plain | text/html')
  })
})

describe('req.acceptsEncodings()', () => {
  it('should detect "Accept-Encoding" header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const encodings = getAcceptsEncodings(req)()

      res.send(Array.isArray(encodings) ? encodings[0] : encodings)
    })

    await fetch.get('/').set('Accept-Encoding', 'gzip').expect('gzip')
  })
  it('should parse multiple values', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const encodings = getAcceptsEncodings(req)()

      res.end((encodings as string[]).join(' | '))
    })

    await fetch.get('/').set('Accept-Encoding', 'gzip, br').expect('gzip | br | identity')
  })
})

describe('req.range', () => {
  it('should return parsed ranges', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const array = range(300)

      res.send(JSON.stringify(array))
    })

    await fetch.get('/').set('Range', 'bytes=0-1000').expect(`[{"start":0,"end":299}]`)
  })
  it('should cap to the given size', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const size = 300
      expect((range(size) as Ranges)?.[0].end).toBe(size - 1)
      res.end()
    })

    await fetch.get('/').set('Range', 'bytes=0-1000')
  })
  it('should cap to the given size when open-ended', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const size = 300
      expect((range(size) as Ranges)?.[0].end).toBe(size - 1)
      res.end()
    })

    await fetch.get('/').set('Range', 'bytes=0-')
  })
})

run()
