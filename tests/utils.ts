import { getFreePort } from 'https://deno.land/x/free_port@v1.2.0/mod.ts'
import { superdeno } from 'https://deno.land/x/superdeno@4.4.0/mod.ts'
import { App, AppConstructor, Handler, THRequest, THResponse } from '../mod.ts'

const random = (min: number, max: number): number =>
  Math.round(Math.random() * (max - min)) + min

export const randomPort = async () => await getFreePort(random(2048, 8064))

export const BindToSuperDeno = <Req extends THRequest, Res extends THResponse>(
  app: App<unknown, Req, Res>,
) => {
  return superdeno(app.handler)
}

export const InitAppAndTest = (
  handler: Handler,
  route = '/',
  settings: AppConstructor<Request, THResponse> = {},
  method: 'get' | 'post' | 'patch' | 'put' | 'use' = 'use',
) => {
  const app = new App<unknown, THRequest, THResponse>(settings)

  app[method](route, handler)

  return { fetch: BindToSuperDeno(app), app }
}

export const runServer = (h: Handler) => {
  const app = new App()

  app.use(h)

  const request = BindToSuperDeno(app)

  return request
}