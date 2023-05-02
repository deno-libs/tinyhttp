import { describe, expect, it, makeFetch, run } from '../../dev_deps.ts'
import { path } from '../../deps.ts'
import {
  checkIfXMLHttpRequest,
  getAccepts,
  getAcceptsEncodings,
  getAcceptsLanguages,
  getFreshOrStale,
  getRangeFromHeader,
  getRequestHeader,
  reqIs,
} from '../../extensions/req/mod.ts'
import type { DummyResponse } from '../../response.ts'
import { runServer } from '../util.test.ts'
const __dirname = path.dirname(import.meta.url)

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
          'Accept-Language': 'ru-RU'
        }
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
          'Accept-Language': 'ru-RU, ru;q=0.9, en-US;q=0.8'
        }
      })
      res.expect('ru-RU | ru | en-US')
    })
  })
})
run()
