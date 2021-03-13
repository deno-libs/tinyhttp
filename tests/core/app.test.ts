import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'
import { renderFile as eta } from 'https://deno.land/x/eta@v1.12.1/mod.ts'
import { EtaConfig } from 'https://deno.land/x/eta@v1.12.1/config.ts'
import * as path from 'https://deno.land/std@0.89.0/path/mod.ts'

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

run()
