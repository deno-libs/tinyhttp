import { describe, it, expect, run } from 'https://deno.land/x/tincan@0.2.1/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'
import { renderFile as eta } from 'https://deno.land/x/eta@v1.12.3/mod.ts'
import { EtaConfig } from 'https://deno.land/x/eta@v1.12.3/config.ts'
import * as path from 'https://deno.land/std@0.101.0/path/mod.ts'

describe('App constructor', () => {
  it('app.locals are get and set', () => {
    const app = new App()

    app.locals.hello = 'world'

    expect(app.locals.hello).toBe('world')
  })
  it('Custom noMatchHandler works', async () => {
    const { fetch } = InitAppAndTest(
      (_req, _res, next) => {
        next()
      },
      undefined,
      {
        noMatchHandler: (req) => {
          req.respond({
            status: 404,
            body: `Oopsie! Page ${req.url} is lost.`
          })
        }
      }
    )

    await fetch.get('/').expect(404, 'Oopsie! Page / is lost.')
  })
  it('Custom onError works', async () => {
    const app = new App({
      onError: (err, req) => {
        req.respond({
          status: 500,
          body: `Ouch, ${err} hurt me on ${req.url} page.`
        })
      }
    })

    app.use((_req, _res, next) => next('you'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/').expect(500, 'Ouch, you hurt me on / page.')
  })
})

describe('Template engines', () => {
  it('Works with eta out of the box', async () => {
    const app = new App<EtaConfig>({
      onError: (err) => console.log(err)
    })

    const pwd = Deno.cwd()

    Deno.chdir(path.resolve(pwd, 'tests/fixtures'))

    app.engine('eta', eta)

    app.use((_, res) => {
      res.render('index.eta', {
        name: 'Eta'
      })
      Deno.chdir(pwd)
    })

    const fetch = BindToSuperDeno(app)

    await fetch.get('/').expect(200, 'Hello from Eta')
  })
})

describe('Routing', () => {
  it('should respond on matched route', async () => {
    const { fetch } = InitAppAndTest((_req, res) => void res.send('Hello world'), '/route')

    await fetch.get('/route').expect(200, 'Hello world')
  })
  it('should match wares containing base path', async () => {
    const app = new App()

    app.use('/abc', (_req, res) => void res.send('Hello world'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/abc/def').expect(200, 'Hello world')
  })
  it('"*" should catch all undefined routes', async () => {
    const app = new App()

    app
      .get('/route', (_req, res) => void res.send('A different route'))
      .all('*', (_req, res) => void res.send('Hello world'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/test').expect(200, 'Hello world')
  })
  it('should throw 404 on no routes', async () => {
    await BindToSuperDeno(new App()).get('/').expect(404)
  })
})

describe('app.route(path)', () => {
  it('app.route works properly', async () => {
    const app = new App()

    app.route('/').get((req, res) => res.end(req.url))

    await BindToSuperDeno(app).get('/').expect(200)
  })
  it('app.route supports chaining route methods', async () => {
    const app = new App()

    app.route('/').get((req, res) => res.end(req.url))

    await BindToSuperDeno(app).get('/').expect(200)
  })
  it('app.route supports chaining route methods', async () => {
    const app = new App()

    app
      .route('/')
      .get((_, res) => res.send('GET request'))
      .post((_, res) => res.send('POST request'))

    await BindToSuperDeno(app).post('/').expect(200, 'POST request')
  })
})

describe('app.use(args)', () => {
  it('should chain middleware', () => {
    const app = new App()

    app.use((_req, _res, next) => next()).use((_req, _res, next) => next())

    expect(app.middleware.length).toBe(2)
  })
  it('req and res inherit properties from previous middlewares', async () => {
    const app = new App()

    app
      .use((_req, res, next) => {
        res.locals.hello = 'world'

        next()
      })
      .get('/', (_, res) => {
        res.send(res.locals)
      })

    const fetch = BindToSuperDeno(app)

    await fetch.get('/').expect(200, '{\n  "hello": "world"\n}')
  })
  it('should flatten the array of wares', async () => {
    const app = new App()

    let counter = 1

    app.use('/abc', [(_1, _2, next) => counter++ && next(), (_1, _2, next) => counter++ && next()], (_req, res) => {
      expect(counter).toBe(3)
      res.send('Hello World')
    })

    const fetch = BindToSuperDeno(app)

    await fetch.get('/abc').expect(200, 'Hello World')
  })
})

describe('next(err?)', () => {
  it('next function skips current middleware', async () => {
    const app = new App()

    app.locals['log'] = 'test'

    app
      .use((req, _res, next) => {
        app.locals['log'] = req.url
        next()
      })
      .use((_req, res) => void res.json({ ...app.locals }))

    await BindToSuperDeno(app).get('/').expect(200, '{\n  "log": "/"\n}')
  })
  it('next function handles errors', async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.url === '/broken') {
        next('Your appearance destroyed this world.')
      } else {
        res.send('Welcome back')
      }
    })

    await BindToSuperDeno(app).get('/broken').expect(500, 'Your appearance destroyed this world.')
  })
  it("next function sends error message if it's not an HTTP status code or string", async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.url === '/broken') {
        next(new Error('Your appearance destroyed this world.'))
      } else {
        res.send('Welcome back')
      }
    })

    await BindToSuperDeno(app).get('/broken').expect(500, 'Your appearance destroyed this world.')
  })
  it('errors in async wares do not destroy the app', async () => {
    const app = new App()

    app.use(async (_req, _res) => {
      throw await `bruh`
    })

    await BindToSuperDeno(app).get('/').expect(500, 'bruh')
  })

  it('errors in sync wares do not destroy the app', async () => {
    const app = new App()

    app.use((_req, _res) => {
      throw `bruh`
    })

    await BindToSuperDeno(app).get('/').expect(500, 'bruh')
  })
})

describe('HTTP methods', () => {
  it('app.get handles get request', async () => {
    const app = new App()

    app.get('/', (req, res) => void res.send(req.method))

    await BindToSuperDeno(app).get('/').expect(200, 'GET')
  })
  it('app.post handles post request', async () => {
    const { fetch } = InitAppAndTest((req, res) => void res.send(req.method), '/', {}, 'post')

    await fetch.post('/').expect(200, 'POST')
  })
  it('app.put handles put request', async () => {
    const { fetch } = InitAppAndTest((req, res) => void res.send(req.method), '/', {}, 'put')

    await fetch.put('/').expect(200, 'PUT')
  })
  it('app.patch handles patch request', async () => {
    const { fetch } = InitAppAndTest((req, res) => void res.send(req.method), '/', {}, 'patch')

    await fetch.patch('/').expect(200, 'PATCH')
  })
  it('app.head handles head request', async () => {
    const app = new App()

    app.head('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.head('/').expect(200)
  })
  it('app.delete handles delete request', async () => {
    const app = new App()

    app.delete('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.delete('/').expect(200, 'DELETE')
  })
  it('app.checkout handles checkout request', async () => {
    const app = new App()

    app.checkout('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.checkout('/').expect(200, 'CHECKOUT')
  })
  it('app.copy handles copy request', async () => {
    const app = new App()

    app.copy('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.copy('/').expect(200, 'COPY')
  })
  it('app.lock handles lock request', async () => {
    const app = new App()

    app.lock('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.lock('/').expect(200, 'LOCK')
  })
  it('app.merge handles merge request', async () => {
    const app = new App()

    app.merge('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.merge('/').expect(200, 'MERGE')
  })
  it('app.mkactivity handles mkactivity request', async () => {
    const app = new App()

    app.mkactivity('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.mkactivity('/').expect(200, 'MKACTIVITY')
  })
  it('app.mkcol handles mkcol request', async () => {
    const app = new App()

    app.mkcol('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.mkcol('/').expect(200, 'MKCOL')
  })
  it('app.move handles move request', async () => {
    const app = new App()

    app.move('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.move('/').expect(200, 'MOVE')
  })
  it('app.search handles search request', async () => {
    const app = new App()

    app.search('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.search('/').expect(200, 'SEARCH')
  })
  it('app.notify handles notify request', async () => {
    const app = new App()

    app.notify('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.notify('/').expect(200, 'NOTIFY')
  })
  it('app.purge handles purge request', async () => {
    const app = new App()

    app.purge('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.purge('/').expect(200, 'PURGE')
  })
  it('app.report handles report request', async () => {
    const app = new App()

    app.report('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.report('/').expect(200, 'REPORT')
  })
  it('app.subscribe handles subscribe request', async () => {
    const app = new App()

    app.subscribe('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.subscribe('/').expect(200, 'SUBSCRIBE')
  })
  it('app.unsubscribe handles unsubscribe request', async () => {
    const app = new App()

    app.unsubscribe('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.unsubscribe('/').expect(200, 'UNSUBSCRIBE')
  })
  /* it('app.trace handles trace request', async () => {
    const app = new App()

    app.trace('/', (req, res) => void res.send(req.method))

    const fetch = BindToSuperDeno(app)

    await fetch.trace('/').expect(200, 'TRACE')
  })
 */ it('HEAD request works when any of the method handlers are defined', async () => {
    const app = new App()

    app.get('/', (_, res) => res.send('It works'))

    const fetch = BindToSuperDeno(app)

    await fetch.head('/').expect(200)
  })
  it('HEAD request does not work for undefined handlers', async () => {
    const app = new App()

    app.get('/', (_, res) => res.send('It works'))

    const fetch = BindToSuperDeno(app)

    await fetch.head('/hello').expect(404)
  })
})

describe('Route handlers', () => {
  it('router accepts array of middlewares', async () => {
    const app = new App()

    app.use('/', [
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody = 'hello'
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += ' '
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += 'world'
        n()
      },
      (req, res) => {
        res.send(req.parsedBody)
      }
    ])

    const request = BindToSuperDeno(app)

    await request.get('/').expect(200, 'hello world')
  })
  it('router accepts path as array of middlewares', async () => {
    const app = new App()

    app.use([
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody = 'hello'
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += ' '
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += 'world'
        n()
      },
      (req, res) => {
        res.send(req.parsedBody)
      }
    ])

    const request = BindToSuperDeno(app)

    await request.get('/').expect(200, 'hello world')
  })
  it('router accepts list of middlewares', async () => {
    const app = new App()

    app.use(
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody = 'hello'
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += ' '
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += 'world'
        n()
      },
      (req, res) => {
        res.send(req.parsedBody)
      }
    )

    const request = BindToSuperDeno(app)

    await request.get('/').expect(200, 'hello world')
  })
  it('router accepts array of wares', async () => {
    const app = new App()

    app.get('/', [
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody = 'hello'
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += ' '
        n()
      },
      (req, _, n) => {
        // @ts-ignore
        req.parsedBody += 'world'
        n()
      },
      (req, res) => {
        res.send(req.parsedBody)
      }
    ])

    const request = BindToSuperDeno(app)

    await request.get('/').expect(200, 'hello world')
  })
  it('router methods do not match loosely', async () => {
    const app = new App()

    app.get('/route', (_, res) => res.send('found'))

    const request = BindToSuperDeno(app)

    await request.get('/route/subroute').expect(404)
  })
})

describe('Subapps', () => {
  it('sub-app mounts on a specific path', () => {
    const app = new App()

    const subApp = new App()

    app.use('/subapp', subApp)

    expect(subApp.mountpath).toBe('/subapp')
  })
  it('sub-app mounts on root', async () => {
    const app = new App()

    const subApp = new App()

    subApp.use((_, res) => void res.send('Hello World!'))

    app.use(subApp)

    const request = BindToSuperDeno(app)

    await request.get('/').expect(200, 'Hello World!')
  })
  it('sub-app handles its own path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.use((_, res) => void res.send('Hello World!'))

    app.use('/subapp', subApp)

    const request = BindToSuperDeno(app)

    await request.get('/subapp').expect(200, 'Hello World!')
  })
  it('sub-app paths get prefixed with the mount path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/route', (_, res) => res.send(`Hello from ${subApp.mountpath}`))

    app.use('/subapp', subApp)

    const request = BindToSuperDeno(app)

    await request.get('/subapp/route').expect(200, 'Hello from /subapp')
  })
  /* it('req.originalUrl does not change', async () => {
    const app = new App()
    const subApp = new App()
    subApp.get('/route', (req, res) =>
      res.send({
        origUrl: req.originalUrl,
        url: req.url,
        path: req.path
      })
    )
    app.use('/subapp', subApp)
    const server = app.listen()
    const fetch = makeFetch(server)
    await fetch('/subapp/route').expect(200, {
      origUrl: '/subapp/route',
      url: '/route',
      path: '/route'
    })
  }) */

  it('lets other wares handle the URL if subapp doesnt have that path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/route', (_, res) => res.send(subApp.mountpath))

    app.use('/test', subApp)

    app.use('/test3', (req, res) => res.send(req.url))

    const request = BindToSuperDeno(app)

    await request.get('/test/route').expect(200, '/test')
  })

  it('should mount app on a specified path', () => {
    const app = new App()

    const subapp = new App()

    app.use('/subapp', subapp)

    expect(subapp.mountpath).toBe('/subapp')
  })
  it('should mount on "/" if path is not specified', () => {
    const app = new App()

    const subapp = new App()

    app.use(subapp)

    expect(subapp.mountpath).toBe('/')
  })
  it('app.parent should reference to the app it was mounted on', () => {
    const app = new App()

    const subapp = new App()

    app.use(subapp)

    expect(subapp.parent).toBe(app)
  })
  it('app.path() should return the mountpath', () => {
    const app = new App()

    const subapp = new App()

    app.use('/subapp', subapp)

    expect(subapp.path()).toBe('/subapp')
  })
  it('app.path() should nest mountpaths', () => {
    const app = new App()

    const subapp = new App()

    const subsubapp = new App()

    subapp.use('/admin', subsubapp)

    app.use('/blog', subapp)

    expect(subsubapp.path()).toBe('/blog/admin')
  })
  it('middlewares of a subapp should preserve the path', () => {
    const app = new App()

    const subapp = new App()

    subapp.use('/path', (_req, _res) => void 0)

    app.use('/subapp', subapp)

    expect(subapp.middleware[0].path).toBe('/path')
  })
  it('matches when mounted on params', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/', (_, res) => res.send('hit'))

    app.use('/users/:userID', subApp)

    const request = BindToSuperDeno(app)

    await request.get('/users/123/').expect(200, 'hit')
  })
  it('matches when mounted on params and on custom subapp route', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/route', (_, res) => res.send('hit'))

    app.use('/users/:userID', subApp)

    const request = BindToSuperDeno(app)

    await request.get('/users/123/route').expect(200, 'hit')
  })
})

describe('App settings', () => {
  describe('xPoweredBy', () => {
    it('is enabled by default', () => {
      const app = new App()

      expect(app.settings.xPoweredBy).toBe(true)
    })
    it('should set X-Powered-By to "tinyhttp"', async () => {
      const { fetch } = InitAppAndTest((_req, res) => void res.send('hi'))

      await fetch.get('/').expect('X-Powered-By', 'tinyhttp')
    })
    /* it('when disabled should not send anything', async () => {
      const app = new App({ settings: { xPoweredBy: false } })

      app.use((_req, res) => void res.send('hi'))

      const request = BindToSuperDeno(app)

      await request.get('/').expect('X-Powered-By', null)
    }) */
  })
  describe('bindAppToReqRes', () => {
    it('references the current app instance in req.app and res.app', async () => {
      const app = new App({
        settings: {
          bindAppToReqRes: true
        }
      })

      app.locals['hello'] = 'world'

      app.use((req, res) => {
        expect(req.app).toBeInstanceOf(App)
        expect(res.app).toBeInstanceOf(App)
        expect(req.app.locals['hello']).toBe('world')
        expect(res.app.locals['hello']).toBe('world')
        res.end()
      })

      const request = BindToSuperDeno(app)

      await request.get('/').expect(200)
    })
  })

  describe('enableReqRoute', () => {
    it('attach current fn to req.route when enabled', async () => {
      const app = new App({ settings: { enableReqRoute: true } })

      app.use((req, res) => {
        expect(req.route).toEqual(app.middleware[0])
        res.end()
      })

      const request = BindToSuperDeno(app)

      await request.get('/').expect(200)
    })
  })
})

run()
