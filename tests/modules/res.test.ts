import { describe, expect, it, makeFetch, run } from '../../dev_deps.ts'
import { path } from '../../deps.ts'
import {
  append,
  attachment,
  clearCookie,
  cookie,
  download,
  formatResponse,
  getResponseHeader,
  NotAcceptableError,
  redirect,
  send,
  setContentType,
  setHeader,
  setLinksHeader,
  setLocationHeader,
  setVaryHeader,
} from '../../extensions/res/mod.ts'
import type { DummyResponse } from '../../response.ts'
import { runServer } from '../util.test.ts'
const __dirname = path.dirname(import.meta.url)

describe('Response extensions', () => {
  describe('res.set(field, val)', () => {
    it('should set a string header with a string value', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('hello', 'World')
        return new Response('hello', res._init)
      }

      const res = await makeFetch(app)('/')

      res.expectHeader('hello', 'World')
    })
    it('should set an array of header values', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('foo', ['bar', 'baz'])
        return new Response('hello', res._init)
      }

      const res = await makeFetch(app)('/')
      res.expectHeader('foo', 'bar,baz')
    })
    it('should throw if `Content-Type` header is passed as an array', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        try {
          setHeader(res)('content-type', ['foo', 'bar'])
        } catch (e) {
          return new Response((e as TypeError).message, {
            ...res._init,
            status: 500,
          })
        }
        return new Response(null, res._init)
      }
      const res = await makeFetch(app)('/')
      res.expectStatus(500).expect('Content-Type cannot be set to an Array')
    })
    it('if the first argument is object, then map keys to values', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)({ foo: 'bar' })
        return new Response(null, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expectHeader('foo', 'bar')
    })
    it('should not set a charset of one is already set', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('content-type', 'text/plain; charset=UTF-8')
        return new Response(null, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expectHeader('content-type', 'text/plain; charset=UTF-8')
    })
  })
  describe('res.get(field)', () => {
    it('should get a header with a specified field', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('hello', 'World')
        return new Response(getResponseHeader(res)('hello'), res._init)
      }

      const res = await makeFetch(app)('/')

      res.expect('World')
    })
  })
  describe('res.vary(field)', () => {
    it('should set a "Vary" header properly', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setVaryHeader(res)('User-Agent')
        return new Response(null, res._init)
      }
      const res = await makeFetch(app)('/')
      res.expect('Vary', 'Accept-Encoding, User-Agent')
    })
  })
  describe('res.redirect(url, status)', () => {
    it('should set 302 status and message about redirecting', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        redirect(req, res, () => {})('/abc')
        return new Response(res._body, res._init)
      }
      const res = await makeFetch(app)('/', { redirect: 'manual' })
      res.expectStatus(302).expectBody('Found. Redirecting to /abc')
    })
    // it('should follow the redirect', async () => {
    //   const app = (req: Request) => {
    //     const res: DummyResponse = {
    //       _init: { headers: new Headers({}) },
    //       locals: {},
    //     }
    //     if (req.url.includes('/abc')) {
    //       res._init.status = 200
    //       res._body = 'Hello World'
    //     } else {
    //       redirect(req, res, () => {})('/abc')
    //     }
    //     return new Response(res._body, res._init)
    //   }
    //   const res = await makeFetch(app)('/', {
    //     redirect: 'follow',
    //   })

    //   res.expectStatus(200).expectBody('Hello World')
    // })
    // it('should send an HTML link to redirect to', async () => {
    //   const app = runServer((req, res) => {
    //     if (req.url === '/abc') {
    //       res.writeHead(200).end('Hello World')
    //     } else {
    //       // eslint-disable-next-line @typescript-eslint/no-empty-function
    //       redirect(req, res, () => {})('/abc').end()
    //     }
    //   })

    //   await makeFetch(app)('/', {
    //     redirect: 'manual',
    //     headers: {
    //       Accept: 'text/html'
    //     }
    //   }).expect(302, '<p>Found. Redirecting to <a href="/abc">/abc</a></p>')
    // })
    // it('should send an empty response for unsupported MIME types', async () => {
    //   const app = runServer((req, res) => {
    //     redirect(req, res, (err) => res.writeHead(err.status).end(err.message))('/abc').end()
    //   })

    //   await makeFetch(app)('/', {
    //     redirect: 'manual',
    //     headers: {
    //       Accept: 'image/jpeg,image/webp'
    //     }
    //   }).expect(302, '')
    // })
  })
  describe('res.format(obj)', () => {
    it('should send text by default', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        formatResponse(req, res, () => {})({
          'text/plain': (_, res) => {
            res._body = `Hello World`
          },
        })
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect('Hello World')
    })
    it('should send HTML if specified in "Accepts" header', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        formatResponse(req, res, () => {})({
          'text/plain': (_, res) => {
            res._body = `Hello World`
          },
          'text/html': (_, res) => {
            res._body = '<h1>Hello World</h1>'
          },
        })
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/', {
        headers: {
          Accept: 'text/html',
        },
      })

      res
        .expect('<h1>Hello World</h1>')
        .expectHeader('Content-Type', 'text/html')
    })
    it('should throw 406 status when invalid MIME is specified', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        formatResponse(req, res, (err) => {
          res._body = (err as NotAcceptableError).message
          res._init.status = (err as NotAcceptableError).status
        })({
          'text/plain': (_, res) => {
            res._body = `Hello World`
          },
        })
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/', {
        headers: {
          Accept: 'foo/bar',
        },
      })
      res.expectStatus(406).expectBody('Not Acceptable')
    })
    it('should call `default` as a function if specified', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        formatResponse(req, res, () => {})({
          default: (_, res) => {
            res._body = `Hello World`
          },
        })
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect('Hello World')
    })
  })
  describe('res.type(type)', () => {
    it('should detect MIME type', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setContentType(res)('html')
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect('Content-Type', 'text/html; charset=utf-8')
    })
    it('should detect MIME type by extension', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setContentType(res)('.html')
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect('Content-Type', 'text/html; charset=utf-8')
    })
  })
  describe('res.attachment(filename)', () => {
    it('should set Content-Disposition without a filename specified', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        attachment(res)()
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')

      res.expect('Content-Disposition', 'attachment')
    })
    it('should set Content-Disposition with a filename specified', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        attachment(res)(path.join(__dirname, '../fixtures', 'favicon.ico'))
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')

      res.expect('Content-Disposition', 'attachment; filename="favicon.ico"')
    })
  })
  describe('res.download(filename)', () => {
    it('should set Content-Disposition based on path', async () => {
      const app = async (req: Request) => {
        const res: DummyResponse & { send?: ReturnType<typeof send> } = {
          _init: {
            headers: new Headers(),
          },
          locals: {},
        }
        const filePath = path.join(Deno.cwd(), 'tests/fixtures', '/favicon.ico')
        res.send = send(req, res)
        await download(req, res)(filePath)
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')

      res.expect('Content-Disposition', 'attachment; filename="favicon.ico"')
    })
    it('should set Content-Disposition based on filename', async () => {
      const app = async (req: Request) => {
        const res: DummyResponse & { send?: ReturnType<typeof send> } = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        res.send = send(req, res)
        await download(req, res)(
          path.join(Deno.cwd(), 'tests/fixtures', '/favicon.ico'),
          'favicon.icon',
        )
        return new Response(res._body, res._init)
      }
      const res = await makeFetch(app)('/')

      res.expect(
        'Content-Disposition',
        'attachment; filename="favicon.icon"',
      )
    })
    it('should pass the error to a callback', async () => {
      const app = async (req: Request) => {
        const res: DummyResponse & { send?: ReturnType<typeof send> } = {
          _init: { headers: new Headers({}) },
        } as DummyResponse
        res.send = send(req, res)
        await download(req, res)(
          path.join(Deno.cwd(), 'tests/fixtures'),
          'some_file.png',
          (err) => {
            expect((err as Error).message).toContain('readfile')
          }
        )
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expectHeader(
        'Content-Disposition',
        'attachment; filename="some_file.png"',
      )
    })
    it.skip('should set "root" from options', async () => {
      const app = runServer(async (req, res) => {
        return (await download(req, res)('favicon.ico', 'favicon.ico', {
          root: path.join(Deno.cwd(), 'tests/fixtures'),
        })) as unknown as Response
      })
      ;(await makeFetch(app)('/')).expect(
        'Content-Disposition',
        'attachment; filename="favicon.ico"',
      )
    })
    it('should pass options to sendFile', async () => {
      const ac = new AbortController()
      const app = async (req: Request) => {
        const res: DummyResponse & { send?: ReturnType<typeof send> } = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        res.send = send(req, res)
        await download(req, res)(
          path.join(Deno.cwd(), 'tests/fixtures', 'favicon.ico'),
          'favicon.ico',
          { signal: ac.signal },
        )
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expect('Content-Disposition', 'attachment; filename="favicon.ico"')
    })
    it('should set headers from options', async () => {
      const app = async (req: Request) => {
        const res: DummyResponse & { send?: ReturnType<typeof send> } = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        res.send = send(req, res)
        await download(req, res)(
          path.join(Deno.cwd(), 'tests/fixtures', 'favicon.ico'),
          'favicon.ico',
          {
            headers: {
              'X-Custom-Header': 'Value',
            },
          },
        )
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res
        .expect('Content-Disposition', 'attachment; filename="favicon.ico"')
        .expect('X-Custom-Header', 'Value')
    })
  })
  describe('res.cookie(name, value, options)', () => {
    it('serializes the cookie and puts it in a Set-Cookie header', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        cookie(res)('hello', 'world')
        expect(res._init.headers.get('Set-Cookie')).toBe('hello=world; Path=/')
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect(200)
    })
    it('should set "maxAge" and "expires" from options', async () => {
      const maxAge = 3600 * 24 * 365

      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        cookie(res)('hello', 'world', { maxAge })
        expect(res._init.headers.get('Set-Cookie')).toContain(
          `Max-Age=${maxAge}`,
        )
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect(200)
    })
    it('should append to Set-Cookie if called multiple times', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        cookie(res)('hello', 'world')
        cookie(res)('foo', 'bar')
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect(200).expectHeader(
        'Set-Cookie',
        'hello=world; Path=/, foo=bar; Path=/',
      )
    })
  })
  describe('res.clearCookie(name, options)', () => {
    it('sets path to "/" if not specified in options', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        clearCookie(res)('cookie')
        expect(res._init.headers.get('Set-Cookie')).toContain('Path=/;')
        return new Response(res._body, res._init)
      }

      const res = await makeFetch(app)('/')
      res.expect(200)
    })
  })
  describe('res.append(field,value)', () => {
    it('sets new header if header not present', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        append(res)('hello', 'World')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')

      res.expectHeader('hello', 'World')
    })
    it('appends value to existing header value', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('hello', 'World1')
        append(res)('hello', 'World2')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader('hello', ['World1', 'World2'])
    })
    it('appends value to existing header array', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('hello', ['World1', 'World2'])
        append(res)('hello', 'World3')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader('hello', ['World1', 'World2', 'World3'])
    })
    it('appends value array to existing header value', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setHeader(res)('hello', 'World1')
        append(res)('hello', ['World2', 'World3'])
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader('hello', ['World1', 'World2', 'World3'])
    })
  })
  describe('res.links(obj)', () => {
    it('should set "Links" header field', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setLinksHeader(res)({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5',
        })
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader(
        'Link',
        '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"',
      )
        .expectStatus(200)
    })
    it('should set "Links" for multiple calls', async () => {
      const app = () => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setLinksHeader(res)({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5',
        })
        setLinksHeader(res)({
          prev: 'http://api.example.com/users?page=1',
        })
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader(
        'Link',
        '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"',
      )
        .expectStatus(200)
    })
  })

  describe('res.location(url)', () => {
    it('sets the "Location" header', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setLocationHeader(req, res)('https://example.com')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')
      res.expectHeader('Location', 'https://example.com').expectStatus(200)
    })
    it('should encode URL', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setLocationHeader(req, res)('https://google.com?q=\u2603 §10')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')

      res.expectHeader('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
        .expectStatus(200)
    })
    it('should not touch encoded sequences', async () => {
      const app = (req: Request) => {
        const res: DummyResponse = {
          _init: { headers: new Headers({}) },
          locals: {},
        }
        setLocationHeader(req, res)('https://google.com?q=%A710')
        return new Response(res._body, res._init)
      }
      const fetch = makeFetch(app)
      const res = await fetch('/')

      res.expectHeader('Location', 'https://google.com?q=%A710').expectStatus(
        200,
      )
    })
    describe('"url" is back', () => {
      it('should set location from "Referer" header', async () => {
        const app = (req: Request) => {
          const res: DummyResponse = {
            _init: { headers: new Headers({}) },
            locals: {},
          }
          setLocationHeader(req, res)('back')
          return new Response(res._body, res._init)
        }
        const fetch = makeFetch(app)
        const res = await fetch('/', {
          headers: {
            Referer: '/some/page.html',
          },
        })
        res
          .expect('Location', '/some/page.html')
          .expectStatus(200)
      })
      it('should set location from "Referrer" header', async () => {
        const app = (req: Request) => {
          const res: DummyResponse = {
            _init: { headers: new Headers({}) },
            locals: {},
          }
          setLocationHeader(req, res)('back')

          return new Response(res._body, res._init)
        }
        const fetch = makeFetch(app)
        const res = await fetch('/', {
          headers: {
            Referrer: '/some/page.html',
          },
        })
        res.expect('Location', '/some/page.html').expectStatus(200)
      })
      it('should prefer "Referrer" header', async () => {
        const app = (req: Request) => {
          const res: DummyResponse = {
            _init: { headers: new Headers({}) },
            locals: {},
          }
          setLocationHeader(req, res)('back')

          return new Response(res._body, res._init)
        }
        const fetch = makeFetch(app)

        const res = await fetch('/', {
          headers: {
            Referer: '/some/page1.html',
            Referrer: '/some/page2.html',
          },
        })
        res.expect('Location', '/some/page2.html').expectStatus(200)
      })
      it('should set the header to "/" without referrer', async () => {
        const app = (req: Request) => {
          const res: DummyResponse = {
            _init: { headers: new Headers({}) },
            locals: {},
          }
          setLocationHeader(req, res)('back')
          return new Response(res._body, res._init)
        }
        const fetch = makeFetch(app)
        const res = await fetch('/')

        res.expect('Location', '/').expectStatus(200)
      })
    })
  })
})
run()
