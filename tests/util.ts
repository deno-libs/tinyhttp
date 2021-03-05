import { getFreePort } from 'https://deno.land/x/free_port@v1.2.0/mod.ts'
import { superdeno } from 'https://deno.land/x/superdeno@3.0.0/mod.ts'
import { App, Handler, AppConstructor, Request, Response } from '../mod.ts'

function random(min: number, max: number): number {
  return Math.round(Math.random() * (max - min)) + min
}

export const randomPort = async () => {
  return await getFreePort(random(2048, 8064))
}

export function describe(_name: string, fn: () => void | Promise<void>) {
  fn()
}

export const TEST_TIMEOUT = 3000

export function it(name: string, fn: (done?: unknown) => void | Promise<void>) {
  Deno.test(name, async () => {
    let done = (err?: unknown) => {
      if (err) throw err
    }
    let race: Promise<unknown> = Promise.resolve()

    if (fn.length === 1) {
      let resolve: (value?: unknown) => void
      const donePromise = new Promise((r) => {
        resolve = r
      })

      let timeoutId: number

      race = Promise.race([
        new Promise(
          (_, reject) =>
            (timeoutId = setTimeout(() => {
              reject(new Error(`test "${name}" failed to complete by calling "done" within ${TEST_TIMEOUT}ms.`))
            }, TEST_TIMEOUT))
        ),
        donePromise
      ])

      done = (err?: unknown) => {
        clearTimeout(timeoutId)
        resolve()
        if (err) throw err
      }
    }

    await fn(done)
    await race
  })
}

export const BindToSuperDeno = <Req extends Request, Res extends Response>(app: App<unknown, Req, Res>) => {
  const fetch = superdeno(app.handler.bind(app))

  return fetch
}

export const InitAppAndTest = (
  handler: Handler,
  route?: string,
  method = 'get',
  settings: AppConstructor<Request, Response> = {}
) => {
  const app = new App(settings)

  if (route) {
    app[method.toLowerCase() as 'get'](route, handler)
  } else {
    app.use(handler)
  }

  return { fetch: BindToSuperDeno(app), app }
}
