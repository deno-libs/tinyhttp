import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { InitAppAndTest } from '../util.ts'

import { checkIfXMLHttpRequest, getFreshOrStale, getRequestHeader, reqIs } from '../../extensions/req/mod.ts'

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

run()
