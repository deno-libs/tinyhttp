import { getFreePort } from 'https://deno.land/x/free_port@v1.2.0/mod.ts'
import { superdeno } from 'https://deno.land/x/superdeno@3.0.0/mod.ts'
import { App, Handler, AppConstructor, Request, Response, Method } from '../mod.ts'

function random(min: number, max: number): number {
  return Math.round(Math.random() * (max - min)) + min
}

export const randomPort = async () => {
  return await getFreePort(random(2048, 8064))
}

export const BindToSuperDeno = <Req extends Request, Res extends Response>(app: App<unknown, Req, Res>) => {
  const fetch = superdeno(app.attach)

  return fetch
}

export const InitAppAndTest = (
  handler: Handler,
  route = '/',
  settings: AppConstructor<Request, Response> = {},
  method: 'get' | 'post' | 'use' = 'use'
) => {
  const app = new App<unknown, Request, Response>(settings)

  app[method](route, handler)

  return { fetch: BindToSuperDeno(app), app }
}
