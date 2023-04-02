import { resolve } from 'https://deno.land/std@0.182.0/path/win32.ts'
import { App } from '../app.ts'
import { THRequest } from '../request.ts'
import { THResponse } from '../response.ts'
import { AppConstructor, Handler } from '../types.ts'

export const supertest = (app: App) => {
  const listener = Deno.listen({ port: 8080, hostname: 'localhost' })

  const serve = async (conn: Deno.Conn) => {
    const requests = Deno.serveHttp(conn)
    const { request, respondWith } = (await requests.nextRequest())!
    const response = await app.handler(request, conn)
    if (response) {
      respondWith(response)
    }
  }

  return async (url = '', params?: RequestInit) => {
    const p = new Promise<{ res: Response; data?: string }>((resolve) => {
      setTimeout(async () => {
        const res = await fetch(
          `http://localhost:8080${url}`,
          params,
        )
        const data = res.headers.get('Content-Type') === 'application/json'
          ? await res.json()
          : await res.text()

        resolve({ res, data })
        Deno.close(conn.rid + 1)
        listener.close()
      })
    })
    const conn = await listener.accept()
    await serve(conn)
    return p
  }
}

export const initAppAndTest = (
  handler: Handler,
  route = '/',
  settings: AppConstructor<Request, THResponse> = {},
  method: 'get' | 'post' | 'patch' | 'put' | 'use' = 'use',
) => {
  const app = new App<unknown, THRequest, THResponse>(settings)

  app[method](route, handler)

  return { request: supertest(app), app }
}
