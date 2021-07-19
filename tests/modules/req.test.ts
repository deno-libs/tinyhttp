import { describe, it, expect, run } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import { InitAppAndTest, runServer } from '../util.ts'
import { Ranges } from '../../types.ts'
import {
  checkIfXMLHttpRequest,
  getFreshOrStale,
  getRequestHeader,
  getAccepts,
  getAcceptsEncodings,
  getRangeFromHeader,
  reqIs
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

    await fetch.get('/').expect('stale')
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
  it('should have a .type', async () => {
    const request = runServer((req, res) => {
      const range = getRangeFromHeader(req)
      expect((range(300) as Ranges).type).toBe('bytes')
      res.end()
    })

    await request.get('/').set('Range', 'bytes=0-1000')
  })
  it('should accept any type', async () => {
    const request = runServer((req, res) => {
      const range = getRangeFromHeader(req)
      expect((range(300) as Ranges).type).toBe('any')
      res.end()
    })

    await request.get('/').set('Range', 'bytes=0-1000')
  })
  it('should return undefined if no range', async () => {
    const request = runServer((req, res) => {
      const range = getRangeFromHeader(req)
      expect(range(300)).toBeUndefined()
      res.end()
    })

    await request.get('/')
  })
  describe('with options', () => {
    it('should return combined ranges if combine set to true', async () => {
      const request = runServer((req, res) => {
        const range = getRangeFromHeader(req)
        const array = range(300, { combine: true })
        expect(array).toContain({ end: 299, start: 0 })
        expect(array).toHaveLength(1)
        res.end()
      })

      await request.get('/').set('Range', 'bytes=0-100, 101-500')
    })
    it('should return separated ranges if combine set to false', async () => {
      const request = runServer((req, res) => {
        const range = getRangeFromHeader(req)
        const array = range(300, { combine: false })
        expect(array).toContain({ end: 100, start: 0 })
        expect(array).toContain({ end: 299, start: 101 })
        expect(array).toHaveLength(2)
        res.end()
      })

      await request.get('/').set('Range', 'bytes=0-100, 101-500')
    })
  })
})

describe('req.is', () => {
  it('should return the given MIME type when matching', async () => {
    const request = runServer((req, res) => {
      expect(reqIs(req)('text/plain')).toBe('text/plain')
      res.end()
    })
    await request.get('/').set('Content-Type', 'text/plain')
  })
  it('should return false when not matching', async () => {
    const request = runServer((req, res) => {
      expect(reqIs(req)('text/other')).toBe(false)
      res.end()
    })
    await request.get('/').set('Content-Type', 'text/plain')
  })
  it('should return false when Content-Type header is not present', async () => {
    const request = runServer((req, res) => {
      expect(reqIs(req)('text/other')).toBe(false)
      res.end()
    })
    await request.get('/')
  })
  it("Should lookup the MIME type with the extension given (e.g. req.is('json')", async () => {
    const request = runServer((req, res) => {
      expect(reqIs(req)('json')).toBe('json')
      res.end()
    })
    await request.get('/').set('Content-Type', 'application/json')
  })
  it('should ignore charset', async () => {
    const request = runServer((req, res) => {
      expect(reqIs(req)('text/html')).toBe('text/html')
      res.end()
    })
    await request.get('/').set('Content-Type', 'text/html; charset=UTF-8')
  })
})

run()
