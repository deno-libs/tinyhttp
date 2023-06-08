import {
  describe,
  type EtaConfig,
  expect,
  it,
  makeFetch,
  path,
  renderFileAsync,
  run,
} from '../../dev_deps.ts'
import { App } from '../../mod.ts'
import { initAppAndTest } from '../util.test.ts'

const decoder = new TextDecoder()

describe.skip('Testing App', () => {
  it('should launch a basic server', async () => {
    const { fetch } = initAppAndTest((_req, res) => void res.end('Hello World'))
    const res = await fetch('/')
    res.expect('Hello World')
  })
  it('should chain middleware', () => {
    const app = new App()

    app.use((_req, _res, next) => next()).use((_req, _res, next) => next())

    expect(app.middleware.length).toBe(2)
  })
  it('app.locals are get and set', () => {
    const app = new App()

    app.locals.hello = 'world'

    expect(app.locals.hello).toBe('world')
  })
  it('Custom noMatchHandler works', async () => {
    const app = new App({
      noMatchHandler: function fourOrFour(req, res) {
        res.status(404).end(`Oopsie! Page ${req.path} is lost.`)
      },
    })

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expect('Oopsie! Page / is lost.').expectStatus(404)
  })
  it('Custom onError works', async () => {
    const app = new App({
      onError: (err, req) =>
        new Response(`Ouch, ${err} hurt me on ${req?.url} page.`, {
          status: 500,
        }),
    })

    app.use((_req, _res, next) => next('you'))

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expectStatus(500).expect(
      'Ouch, you hurt me on http://localhost:8080/ page.',
    )
  })
  it('req and res inherit properties from previous middlewares', async () => {
    const app = new App()

    app
      .use((_req, res, next) => {
        res.locals = { hello: 'world' }
        next()
      })
      .use((_req, res) => {
        res.json(res.locals)
      })

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expect({ hello: 'world' })
  })
  it('req and res inherit properties from previous middlewares asynchronously', async () => {
    const app = new App()

    app
      .use(async (_, res, next) => {
        res.locals.test = await Deno.readFile(
          `${Deno.cwd()}/tests/fixtures/test.txt`,
        )
        await next()
      })
      .use(async (_, res) => {
        await res.send(decoder.decode(res.locals.test))
      })

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')

    res.expect('I am a text file.')
  })
})

describe.skip('Testing App routing', () => {
  it('should add routes added before app.use', async () => {
    const app = new App()

    const router = new App()
    router.get('/list', (_, res) => {
      res.end('/router/list')
    })

    router.get('/find', (_, res) => {
      res.end('/router/find')
    })
    app.use('/router', router)

    const fetch1 = makeFetch(app.handler)
    const res1 = await fetch1('/router/list')
    res1.expect('/router/list')
    const fetch2 = makeFetch(app.handler)
    const res2 = await fetch2('/router/find')
    res2.expect('/router/find')
  })
  it('should respond on matched route', async () => {
    const { fetch } = initAppAndTest(
      (_req, res) => void res.end('Hello world'),
      '/route',
    )

    const res = await fetch('/route')
    res.expect('Hello world')
  })
  it('should match wares containing base path', async () => {
    const app = new App()

    app.use('/abc', (_req, res) => void res.end('Hello world'))
    ;(await makeFetch(app.handler)('/abc/def')).expectStatus(200).expectBody(
      'Hello world',
    )
    ;(await makeFetch(app.handler)('/abcdef')).expect(404)
  })
  // it('"*" should catch all undefined routes', async () => {
  //   const app = new App()

  //   const server = app.handler

  //   app
  //     .get('/route', (_req, res) => void res.send('A different route'))
  //     .all('*', (_req, res) => void res.send('Hello world'))

  //   await makeFetch(server)('/route').expect(200, 'A different route')

  //   await makeFetch(server)('/test').expect(200, 'Hello world')
  // })
  it('should throw 404 on no routes', async () => {
    const app = new App()
    const fetch = makeFetch(app.handler)
    const res = await fetch('/')
    res.expectStatus(404)
  })
  it('should flatten the array of wares', async () => {
    const app = new App()

    let counter = 1

    app.use('/abc', [
      (_1, _2, next) => {
        counter++
        next()
      },
      (_1, _2, next) => {
        counter++
        next()
      },
    ], (_req, res) => {
      res.end(`${counter}`)
    })
    const fetch = makeFetch(app.handler)

    const res = await fetch('/abc')
    res.expect('3')
  })
  it('should can set url prefix for the application', async () => {
    const app = new App()

    const route1 = new App()
    route1.get('/route1', (_req, res) => void res.end('route1'))

    const route2 = new App()
    route2.get('/route2', (_req, res) => void res.end('route2'))

    const route3 = new App()
    route3.get('/route3', (_req, res) => void res.end('route3'))

    app.use('/abc', ...[route1, route2, route3])
    const fetch1 = makeFetch(app.handler)
    const res1 = await fetch1('/abc/route1')
    res1.expect('route1')
    const fetch2 = makeFetch(app.handler)
    const res2 = await fetch2('/abc/route2')
    res2.expect('route2')
  })
})
describe.skip('next(err)', () => {
  it('next function skips current middleware', async () => {
    const app = new App()

    app.locals['log'] = 'test'

    app
      .use((req, _res, next) => {
        app.locals['log'] = req.path
        next()
      })
      .use((_req, res) => void res.json({ ...app.locals }))
    const fetch = makeFetch(app.handler)
    const res = await fetch('/')
    res.expect(200).expectBody({ log: '/' })
  })
  it('next function handles errors', async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.path === '/broken') {
        next('Your appearance destroyed this world.')
      } else {
        res.end('Welcome back')
      }
    })
    const fetch = makeFetch(app.handler)
    const res = await fetch('/broken')
    res.expectStatus(500).expectBody('Your appearance destroyed this world.')
  })
  it('next function sends error message if it\'s not an HTTP status code or string', async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.path === '/broken') {
        next(new Error('Your appearance destroyed this world.'))
      } else {
        res.end('Welcome back')
      }
    })

    const fetch = makeFetch(app.handler)
    const res = await fetch('/broken')
    res.expectStatus(500).expectBody('Your appearance destroyed this world.')
  })
  it('errors in async wares do not destroy the app', async () => {
    const app = new App()

    // deno-lint-ignore require-await
    app.use(async (_req, _res) => {
      throw `bruh`
    })

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expectStatus(500).expectBody('bruh')
  })

  it('errors in sync wares do not destroy the app', async () => {
    const app = new App()

    app.use((_req, _res) => {
      throw `bruh`
    })

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expectStatus(500).expectBody('bruh')
  })
})

describe.skip('App methods', () => {
  it('`app.set` sets a setting', () => {
    const app = new App().set('subdomainOffset', 1)

    expect(app.settings.subdomainOffset).toBe(1)
  })
  it(`app.enable enables a setting`, () => {
    const app = new App({
      settings: {
        xPoweredBy: false,
      },
    }).enable('xPoweredBy')

    expect(app.settings.xPoweredBy).toBe(true)
  })
  it(`app.disable disables a setting`, () => {
    const app = new App({
      settings: {
        xPoweredBy: true,
      },
    }).disable('xPoweredBy')

    expect(app.settings.xPoweredBy).toBe(false)
  })
  it.skip('app.route works properly', async () => {
    const app = new App()

    app.route('/').get((req, res) => void res.end(req.url))

    const res = await makeFetch(app.handler)('/')
    res.expect(200)
  })
  it.skip('app.route supports chaining route methods', async () => {
    const app = new App()

    app.route('/').get((req, res) => void res.end(req.url))

    const res = await makeFetch(app.handler)('/')
    res.expect(200)
  })
  it.skip('app.route supports chaining route methods', async () => {
    const app = new App()

    app
      .route('/')
      .get((_, res) => void res.end('GET request'))
      .post((_, res) => void res.end('POST request'))

    const res1 = await makeFetch(app.handler)('/')
    res1.expect('GET request')

    const res2 = await makeFetch(app.handler)('/', { method: 'POST' })
    res2.expect('POST request')
  })
})

describe.skip('HTTP methods', () => {
  it('app.get handles get request', async () => {
    const app = new App()

    app.get('/', (req, res) => void res.end(req.method))

    const res = await makeFetch(app.handler)('/')
    res.expect('GET')
  })
  it('app.post handles post request', async () => {
    const { fetch } = initAppAndTest(
      (req, res) => void res.end(req.method),
      '/',
      {},
      'POST',
    )

    const res = await fetch('/', {
      method: 'POST',
    })
    res.expect('POST')
  })
  it('app.put handles put request', async () => {
    const { fetch } = initAppAndTest(
      (req, res) => void res.end(req.method),
      '/',
      {},
      'PUT',
    )

    const res = await fetch('/', {
      method: 'PUT',
    })
    res.expect('PUT')
  })
  it('app.patch handles patch request', async () => {
    const { fetch } = initAppAndTest(
      (req, res) => void res.end(req.method),
      '/',
      {},
      'PATCH',
    )

    const res = await fetch('/', { method: 'PATCH' })
    res.expect('PATCH')
  })
  // it('app.head handles head request', async () => {
  //   const app = new App()

  //   app.head('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'HEAD' }).expect(200, '')
  // })
  // it('app.delete handles delete request', async () => {
  //   const app = new App()

  //   app.delete('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'DELETE' }).expect(200, 'DELETE')
  // })
  // it('app.checkout handles checkout request', async () => {
  //   const app = new App()

  //   app.checkout('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'CHECKOUT' }).expect(200, 'CHECKOUT')
  // })
  // it('app.copy handles copy request', async () => {
  //   const app = new App()

  //   app.copy('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'COPY' }).expect(200, 'COPY')
  // })
  // it('app.lock handles lock request', async () => {
  //   const app = new App()

  //   app.lock('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'LOCK' }).expect(200, 'LOCK')
  // })
  // it('app.merge handles merge request', async () => {
  //   const app = new App()

  //   app.merge('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'MERGE' }).expect(200, 'MERGE')
  // })
  // it('app.mkactivity handles mkactivity request', async () => {
  //   const app = new App()

  //   app.mkactivity('/', (req, res) => void res.end(req.method))

  //   const server = app.handler

  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'MKACTIVITY' }).expect(200, 'MKACTIVITY')
  // })
  // it('app.mkcol handles mkcol request', async () => {
  //   const app = new App()

  //   app.mkcol('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'MKCOL' }).expect(200, 'MKCOL')
  // })
  // it('app.move handles move request', async () => {
  //   const app = new App()

  //   app.move('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'MOVE' }).expect(200, 'MOVE')
  // })
  // it('app.search handles search request', async () => {
  //   const app = new App()

  //   app.search('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'SEARCH' }).expect(200, 'SEARCH')
  // })
  // it('app.notify handles notify request', async () => {
  //   const app = new App()

  //   app.notify('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'NOTIFY' }).expect(200, 'NOTIFY')
  // })
  // it('app.purge handles purge request', async () => {
  //   const app = new App()

  //   app.purge('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'PURGE' }).expect(200, 'PURGE')
  // })
  // it('app.report handles report request', async () => {
  //   const app = new App()

  //   app.report('/', (req, res) => void res.end(req.method))

  //   const fetch = makeFetch(app.handler)

  //   await fetch('/', { method: 'REPORT' }).expect(200, 'REPORT')
  // })
  // it('app.subscribe handles subscribe request', async () => {
  //   const app = new App()

  //   app.subscribe('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'SUBSCRIBE' }).expect(200, 'SUBSCRIBE')
  // })
  // it('app.unsubscribe handles unsubscribe request', async () => {
  //   const app = new App()

  //   app.unsubscribe('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'UNSUBSCRIBE' }).expect(200, 'UNSUBSCRIBE')
  // })
  // it('app.trace handles trace request', async () => {
  //   const app = new App()

  //   app.trace('/', (req, res) => void res.end(req.method))

  //   const server = app.handler
  //   const fetch = makeFetch(server)

  //   await fetch('/', { method: 'TRACE' }).expect(200, 'TRACE')
  // })
  it('HEAD request works when any of the method handlers are defined', async () => {
    const app = new App()

    app.get('/', (_, res) => void res.end('It works'))

    const fetch = makeFetch(app.handler)

    const res = await fetch('/', { method: 'HEAD' })
    res.expect(200)
  })
  it('HEAD request does not work for undefined handlers', async () => {
    const app = new App()

    app.get('/', (_, res) => void res.end('It works'))

    const server = app.handler
    const fetch = makeFetch(server)

    const res = await fetch('/hello', { method: 'HEAD' })
    res.expect(404)
  })
})

describe.skip('Route handlers', () => {
  it('router accepts array of middlewares', async () => {
    const app = new App()

    app.use('/', [
      (_req, res, n) => {
        res.locals.test = 'hello'
        n()
      },
      (_req, res, n) => {
        res.locals.test += ' '
        n()
      },
      (_req, res, n) => {
        res.locals.test += 'world'
        n()
      },
      (_req, res) => {
        res.end(res.locals.test)
      },
    ])

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expect('hello world')
  })
  it('router accepts path as array of middlewares', async () => {
    const app = new App()

    app.use([
      (_, res, n) => {
        res.locals.test = 'hello'
        n()
      },
      (_, res, n) => {
        res.locals.test += ' '
        n()
      },
      (_, res, n) => {
        res.locals.test += 'world'
        n()
      },
      (_, res) => {
        res.end(res.locals.test)
      },
    ])

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expect('hello world')
  })
  it('router accepts list of middlewares', async () => {
    const app = new App()

    app.use(
      (_, res, n) => {
        res.locals.test = 'hello'
        n()
      },
      (_, res, n) => {
        res.locals.test += ' '
        n()
      },
      (_, res, n) => {
        res.locals.test += 'world'
        n()
      },
      (_, res) => {
        res.end(res.locals.test)
      },
    )

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expect('hello world')
  })
  it('router accepts array of wares', async () => {
    const app = new App()

    app.get(
      '/',
      [
        (_, res, n) => {
          res.locals.test = 'hello'
          n()
        },
      ],
      [
        (_, res, n) => {
          res.locals.test += ' '
          n()
        },
      ],
      [
        (_, res, n) => {
          res.locals.test += 'world'
          n()
        },
        (_, res) => {
          res.end(res.locals.test)
        },
      ],
    )

    const fetch = makeFetch(app.handler)
    const res = await fetch('/')

    res.expect('hello world')
  })
  it('router methods do not match loosely', async () => {
    const app = new App()

    app.get('/route', (_, res) => void res.end('found'))

    const fetch1 = makeFetch(app.handler)
    const res1 = await fetch1('/route/subroute')

    res1.expect(404)

    const fetch2 = makeFetch(app.handler)
    const res2 = await fetch2('/route')

    res2.expect('found')
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

    subApp.use((_, res) => void res.end('Hello World!'))

    app.use(subApp)
    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expect('Hello World!')
  })
  it('multiple sub-apps mount on root', async () => {
    
    const app = new App()

    const route1 = new App()
    route1.get('/route1', (_req, res) => void res.end('route1'))
    
    const route2 = new App()
    route2.get('/route2', (_req, res) => void res.end('route2'))
    
    app.use(route1)
    app.use(route2)
    
    const res1 = await makeFetch(app.handler, 8080)('/route1')
    res1.expect('route1')
    
    const res2 = await makeFetch(app.handler, 8081)('/route2')
    res2.expect('route2')
    
    
  })
  it.skip('sub-app handles its own path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.use((_, res) => void res.end('Hello World!'))

    app.use('/subapp', subApp)

    const fetch = makeFetch(app.handler)

    const res = await fetch('/subapp')
    res.expect('Hello World!')
  })
  it.skip('sub-app paths get prefixed with the mount path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get(
      '/route',
      (_, res) => void res.end(`Hello from ${subApp.mountpath}`),
    )

    app.use('/subapp', subApp)

    const server = app.handler

    const fetch = makeFetch(server)

    const res = await fetch('/subapp/route')
    res.expect('Hello from /subapp')
  })
  //   it('sub-app gets mounted via `app.route`', async () => {
  //     const app = new App()

  //     app.route('/path').get((_, res) => res.send('Hello World'))
  //   })

  it.skip('lets other wares handle the URL if subapp doesnt have that path', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/route', (_, res) => void res.end(subApp.mountpath))

    app.use('/test', subApp)

    app.use('/test3', (req, res) => void res.end(req.url))

    const fetch1 = makeFetch(app.handler)

    const res1 = await fetch1('/test/route')
    res1.expect('/test')
    const fetch2 = makeFetch(app.handler)
    const res2 = await fetch2('/test3/abc')
    res2.expect('http://localhost:8080/test3/abc')
  })

  //   it('should mount app on a specified path', () => {
  //     const app = new App()

  //     const subapp = new App()

  //     app.use('/subapp', subapp)

  //     expect(subapp.mountpath).toBe('/subapp')
  //   })
  it.skip('should mount on "/" if path is not specified', () => {
    const app = new App()

    const subapp = new App()

    app.use(subapp)

    expect(subapp.mountpath).toBe('/')
  })
  it.skip('app.parent should reference to the app it was mounted on', () => {
    const app = new App()

    const subapp = new App()

    app.use(subapp)

    expect(subapp.parent).toBe(app)
  })
  it.skip('app.path() should return the mountpath', () => {
    const app = new App()

    const subapp = new App()

    app.use('/subapp', subapp)

    expect(subapp.path()).toBe('/subapp')
  })
  it.skip('app.path() should nest mountpaths', () => {
      const app = new App()

      const subapp = new App()

      const subsubapp = new App()

      subapp.use('/admin', subsubapp)

      app.use('/blog', subapp)

      expect(subsubapp.path()).toBe('/blog/admin')
    })
    it.skip('middlewares of a subapp should preserve the path', () => {
    const app = new App()

    const subapp = new App()

    subapp.use('/path', (_req, _res) => void 0)

    app.use('/subapp', subapp)

    expect(subapp.middleware[0].path).toBe('/path')
  })
  it.skip('matches when mounted on params', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/', (req, res) => void res.end(req.params.userID))

    app.use('/users/:userID', subApp)

    const fetch = makeFetch(app.handler)

    const res = await fetch('/users/123/')
    res.expect('123')
  })
  it.skip('matches when mounted on params and on custom subapp route', async () => {
    const app = new App()

    const subApp = new App()

    subApp.get('/route', (req, res) => void res.end(req.params.userID))

    app.use('/users/:userID', subApp)

    const fetch = makeFetch(app.handler)

    const res = await fetch('/users/123/route')
    res.expect('123')
  })
  it.skip('handles errors by parent when no onError specified', async () => {
    const app = new App({
      onError: (err, req) =>
        new Response(`Ouch, ${err} hurt me on ${req?.url} page.`, {
          status: 500,
        }),
    })

    const subApp = new App()

    subApp.get('/route', (req, res, next) => next('you'))

    app.use('/subapp', subApp)

    const fetch = makeFetch(app.handler)
    const res = await fetch('/subapp/route')

    res.expectStatus(500).expectBody(
      'Ouch, you hurt me on http://localhost:8080/subapp/route page.',
    )
  })
  it.skip('handles errors in sub when onError is defined', async () => {
    const app = new App({
      onError: (err, req) =>
      new Response(`Ouch, ${err} hurt me on ${req?.url} page.`, {
        status: 500,
      })
    })

    const subApp = new App({
      onError: (err, req) =>
      new Response(`Handling ${err} from child on ${req?.url} page.`, {
        status: 500,
      })
    })

    subApp.get('/route', async (req, res, next) => await next('you'))

    app.use('/subapp', subApp)

    const server = app.handler
    const fetch = makeFetch(server)

    const res = await fetch('/subapp/route')
    res.expectStatus(500).expectBody('Handling you from child on /subapp/route page.')
  })
})
describe.skip('Template engines', () => {
  it('works with eta out of the box', async () => {
    const app = new App<EtaConfig>()

    app.engine('eta', renderFileAsync)

    app.use(async (_, res) => {
      await res.render(
        'index.eta',
        {
          name: 'Eta',
        },
        {
          viewsFolder: `${Deno.cwd()}/tests/fixtures/views`,
        },
      )
    })

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expectBody('Hello from Eta')
  })
  it('can render without data passed', async () => {
    const app = new App<EtaConfig>()
    app.set('views', path.resolve(Deno.cwd(), 'tests/fixtures/views'))

    app.engine('eta', renderFileAsync)

    app.use(async (_, res) => {
      await res.render('empty.eta')
    })

    const fetch = makeFetch(app.handler)

    const res = await fetch('/')
    res.expectBody('Hello World')
  })
})

describe.skip('App settings', () => {
  describe('xPoweredBy', () => {
    it('is enabled by default', () => {
      const app = new App()

      expect(app.settings.xPoweredBy).toBe(true)
    })
    it('should set X-Powered-By to "tinyhttp"', async () => {
      const { fetch } = initAppAndTest((_req, res) => void res.end('hi'))
      const res = await fetch('/')
      await res.expectHeader('X-Powered-By', 'tinyhttp')
    })
    it('when disabled should not send anything', async () => {
      const app = new App({ settings: { xPoweredBy: false } })

      app.use((_req, res) => void res.send('hi'))

      const fetch = makeFetch(app.handler)
      const res = await fetch('/')

      res.expectHeader('X-Powered-By', null)
    })
  })
  describe('bindAppToReqRes', () => {
    it('references the current app instance in req.app and res.app', async () => {
      const app = new App({
        settings: {
          bindAppToReqRes: true,
        },
      })

      app.locals['hello'] = 'world'

      app.use((req, res) => {
        expect(req.app).toBeInstanceOf(App)
        expect(res.app).toBeInstanceOf(App)
        expect(req.app?.locals['hello']).toBe('world')
        expect(res.app?.locals['hello']).toBe('world')
        res.end()
      })

      const fetch = makeFetch(app.handler)
      const res = await fetch('/')

      res.expect(200)
    })
  })
  describe('enableReqRoute', () => {
    it('attach current fn to req.route when enabled', async () => {
      const app = new App({ settings: { enableReqRoute: true } })

      app.use((req, res) => {
        expect(req.route).toEqual(app.middleware[0])
        res.end()
      })

      const fetch = makeFetch(app.handler)
      const res = await fetch('/')

      res.expect(200)
    })
  })
})

run()
