import { describe, expect, it, makeFetch, run } from '../../dev_deps.ts'
import {
  checkIfXMLHttpRequest,
  getAccepts,
  getAcceptsEncodings,
  getAcceptsLanguages,
  getFreshOrStale,
  getHostname,
  getIP,
  getIPs,
  getProtocol,
  getRangeFromHeader,
  getRequestHeader,
  getSubdomains,
  reqIs,
} from '../../extensions/req/mod.ts'
import type { DummyResponse } from '../../response.ts'
import { runServer } from '../util.test.ts'
import { setHeader } from '../../extensions/res/headers.ts'
import { ReqWithUrlAndConn } from '../../request.ts'

describe('Request extensions', () => {
  describe('req.get(header)', () => {
    it('should return a specified header', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        return new Response(getRequestHeader(req)('accept'), res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect('*/*')
    })
    it('should handle "referer"', async () => {
      const app = runServer((req, res) => {
        return new Response(getRequestHeader(req)('referrer'), res._init)
      })
      const res = await makeFetch(app)('/', {
        headers: {
          'Referrer-Policy': 'unsafe-url',
          referer: 'localhost:3000',
        },
      })
      res.expect('localhost:3000')
    })
    it('should handle "referrer"', async () => {
      const app = runServer((req, res) => {
        return new Response(getRequestHeader(req)('referrer'), res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'Referrer-Policy': 'unsafe-url',
          referrer: 'localhost:3000',
        },
      })
      res.expect('localhost:3000')
    })
  })
  describe('req.xhr', () => {
    it('should be false in node environment', async () => {
      const app = runServer((req, res) => {
        return new Response(
          `Browser request: ${checkIfXMLHttpRequest(req) ? 'yes' : 'no'}`,
          res._init,
        )
      })

      const res = await makeFetch(app)('/')
      res.expect('Browser request: no')
    })
  })
  describe('req.accepts()', () => {
    it('should detect an "Accept" header', async () => {
      const app = runServer((req, res) => {
        const accepts = getAccepts(req)()
        return new Response((accepts as string)[0], res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          Accept: 'text/plain',
        },
      })
      res.expect('text/plain')
    })
    it('should parse multiple values', async () => {
      const app = runServer((req, res) => {
        const accepts = getAccepts(req)()
        return new Response((accepts as string[]).join(' | '), res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          Accept: 'text/plain, text/html',
        },
      })
      res.expect('text/plain | text/html')
    })
  })
  describe('req.acceptsLanguages()', () => {
    it('should detect "Accept-Language" header', async () => {
      const app = runServer((req, res) => {
        const languages = getAcceptsLanguages(req)()
        return new Response((languages as string[])[0], res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'Accept-Language': 'ru-RU',
        },
      })
      res.expect('ru-RU')
    })
    it('should parse multiple values', async () => {
      const app = runServer((req, res) => {
        const languages = getAcceptsLanguages(req)()

        return new Response((languages as string[]).join(' | '), res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'Accept-Language': 'ru-RU, ru;q=0.9, en-US;q=0.8',
        },
      })
      res.expect('ru-RU | ru | en-US')
    })
  })
  describe('req.acceptsEncoding()', () => {
    it('should detect "Accept-Encoding" header', async () => {
      const app = runServer((req, res) => {
        const languages = getAcceptsEncodings(req)()
        return new Response((languages as string[])[0], res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'Accept-Encoding': 'gzip',
        },
      })
      res.expect('gzip')
    })
    it('should parse multiple values', async () => {
      const app = runServer((req, res) => {
        const languages = getAcceptsEncodings(req)()

        return new Response((languages as string[]).join(' | '), res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5',
        },
      })
      res.expect('deflate | gzip | *')
    })
  })
  describe('req.fresh', () => {
    it('returns false if method is neither GET nor HEAD', async () => {
      const app = runServer((req, res) => {
        const fresh = getFreshOrStale(req, res)

        return new Response(fresh ? 'fresh' : 'stale', res._init)
      })

      const res = await makeFetch(app)('/', {
        method: 'POST',
        body: 'Hello World',
      })
      res.expect('stale')
    })
    it('returns true when the resource is not modified', async () => {
      const etag = '123'
      const app = runServer((req, res) => {
        setHeader(res)('ETag', etag)
        const fresh = getFreshOrStale(req, res)

        return new Response(fresh ? 'fresh' : 'stale', res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'If-None-Match': etag,
        },
      })
      res.expect('fresh')
    })
    it('should return false when the resource is modified', async () => {
      const etag = '123'
      const app = runServer((req, res) => {
        setHeader(res)('ETag', etag)
        const fresh = getFreshOrStale(req, res)

        return new Response(fresh ? 'fresh' : 'stale', res._init)
      })

      const res = await makeFetch(app)('/', {
        headers: {
          'If-None-Match': '12345',
        },
      })
      res.expect('stale')
    })
    it('returns false if status code is neither >=200 nor < 300, nor 304', async () => {
      const app = runServer((req, res) => {
        res._init.status = 418

        const fresh = getFreshOrStale(req, res)

        return new Response(fresh ? 'fresh' : 'stale', res._init)
      })

      const res = await makeFetch(app)('/')
      res.expect('stale')
    })
  })
  describe('req.range', () => {
    it('should return parsed ranges', async () => {
      const app = runServer((req) => {
        const range = getRangeFromHeader(req)
        const result = range()
        expect(result).toEqual({
          rangeUnit: 'bytes',
          rangeSet: [{ firstPos: 0, lastPos: 1000 }],
        })
        return new Response(null)
      })

      await makeFetch(app)('/', {
        headers: {
          Range: 'bytes=0-1000',
        },
      })
    })
  })
  describe('req.is', () => {
    it('should return the given MIME type when matching', async () => {
      const app = runServer((req, res) => {
        expect(reqIs(req)('text/plain')).toBe('text/plain')
        return new Response(null)
      })
      await makeFetch(app)('/', {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    })
    it('should return false when not matching', async () => {
      const app = runServer((req) => {
        expect(reqIs(req)('text/other')).toBe(false)
        return new Response(null)
      })
      await makeFetch(app)('/', {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    })
    it('should return false when Content-Type header is not present', async () => {
      const app = runServer((req) => {
        expect(reqIs(req)('text/other')).toBe(false)
        return new Response(null)
      })
      await makeFetch(app)('/', {
        headers: {},
      })
    })
    it('Should lookup the MIME type with the extension given (e.g. req.is(\'json\')', async () => {
      const app = runServer((req) => {
        expect(reqIs(req)('json')).toBe('json')
        return new Response(null)
      })
      await makeFetch(app)('/', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
    it('should ignore charset', async () => {
      const app = runServer((req) => {
        expect(reqIs(req)('text/html')).toBe('text/html')
        return new Response(null)
      })
      await makeFetch(app)('/', {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        },
      })
    })
  })
  describe('Network extensions', () => {
    if(Deno.env.get('GITHUB_ACTION')){
      it('req.ip & req.ips is being parsed properly', async () => {
        const app = runServer((_req, _res, conn) => {
          const req = _req as ReqWithUrlAndConn
          req.conn = conn
          req._urlObject = new URL(req.url)
          const ip = getIP(req)
          const ips = getIPs(req)
          expect(ip).toEqual('1')
          expect(ips).toEqual(['::1'])
          return new Response(null)
        })
  
        const res = await makeFetch(app)('/')
        res.expect('')
      })
    }
    it('req.protocol is http by default', async () => {
      const app = runServer((_req, _res, conn) => {
        const req = _req as ReqWithUrlAndConn
        req.conn = conn
        req._urlObject = new URL(req.url)

        expect(getProtocol(req)).toEqual('http')
        return new Response(null)
      })

      const res = await makeFetch(app)('/')
      res.expect('')
    })
    it('req.hostname is defined', async () => {
      const app = runServer((_req, _res, conn) => {
        const req = _req as ReqWithUrlAndConn
        req.conn = conn
        req._urlObject = new URL(req.url)

        expect(getHostname(req)).toEqual('localhost')
        return new Response(null)
      })

      const res = await makeFetch(app)('/')
      res.expect('')
    })
    it('req.subdomains is empty by default', async () => {
      const app = runServer((_req, _res, conn) => {
        const req = _req as ReqWithUrlAndConn
        req.conn = conn
        req._urlObject = new URL(req.url)

        expect(getSubdomains(req)).toEqual([])
        return new Response(null)
      })

      const res = await makeFetch(app)('/')
      res.expect('')
    })
  })
})

run()
