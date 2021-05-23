import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'
import { renderFile as eta } from 'https://deno.land/x/eta@v1.12.1/mod.ts'
import { EtaConfig } from 'https://deno.land/x/eta@v1.12.1/config.ts'
import * as path from 'https://deno.land/std@0.97.0/path/mod.ts'

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

run()
