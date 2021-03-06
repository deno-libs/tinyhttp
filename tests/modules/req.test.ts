// import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts'
import { describe, it, InitAppAndTest } from '../util.ts'

import {
  checkIfXMLHttpRequest,
  getAccepts,
  getAcceptsEncodings,
  getFreshOrStale,
  getRequestHeader
  /*  getRangeFromHeader,
  reqIs */
} from '../../extensions/req/mod.ts'
// import { Ranges } from '../../types.ts'

describe('Request extensions', () => {
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

      await fetch
        .get('/')
        .set('referer', 'localhost:3000')
        .set('Referrer-Policy', 'unsafe-url')
        .expect('localhost:3000')
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
})
