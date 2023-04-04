import { App } from '../app.ts'
import { THRequest } from '../request.ts'
import { THResponse } from '../response.ts'
import { AppConstructor, Handler } from '../types.ts'
import { makeFetch } from 'https://deno.land/x/superfetch@1.0.0/mod.ts'

export const supertest = (app: App) => {
  const fetch = makeFetch((req, conn) => app.handler(req, conn))

  return fetch
}

export const initAppAndTest = (
  handler: Handler,
  route = '/',
  settings: AppConstructor<Request, THResponse> = {},
  method: 'get' | 'post' | 'patch' | 'put' | 'use' = 'use',
) => {
  const app = new App<unknown, THRequest, THResponse>(settings)

  app[method](route, handler)

  return { fetch: supertest(app), app }
}
