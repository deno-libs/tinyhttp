import { getFreePort } from 'https://deno.land/x/free_port@v1.2.0/mod.ts'
import { superdeno } from 'https://deno.land/x/superdeno@4.3.0/mod.ts'
import { App, Handler, AppConstructor, Request, Response } from '../mod.ts'

const random = (min: number, max: number): number => Math.round(Math.random() * (max - min)) + min

export const randomPort = async () => await getFreePort(random(2048, 8064))

export const BindToSuperDeno = <Req extends Request, Res extends Response>(app: App<unknown, Req, Res>) => {
  return superdeno(app.attach)
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
