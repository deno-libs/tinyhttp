// import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts'
import { describe, it, InitAppAndTest } from '../util.ts'

import {
  checkIfXMLHttpRequest,
  getAccepts,
  /* getAcceptsEncodings,
  getFreshOrStale, */
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
})
