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

run()
