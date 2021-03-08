import { describe, it, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'

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

run()
