import { App } from '../app.ts'
import { THRequest } from '../request.ts'
import { THResponse } from '../response.ts'
import { AppConstructor, Handler } from '../types.ts'

export const supertest = (app: App) => {
  const listener = Deno.listen({ port: 8080, hostname: 'localhost' })

  const serve = async () => {
    const conn = await listener.accept()
    const requests = Deno.serveHttp(conn)
    const { request, respondWith } = (await requests.nextRequest())!
    const response = await app.handler(request, conn)
    if (response) {
      respondWith(response)
    }
  }
  return {
    text: async (
      opts: { url: string; params?: RequestInit } = { url: '/' },
      cb: (x: string) => void,
    ) => {
      setTimeout(async () => {
        const res = await fetch(
          `http://localhost:8080/${opts.url}`,
          opts.params,
        )
        const text = await res.text()
        cb(text)
        Deno.close(8)
        listener.close()
      })
      await serve()
    },
    json: async (
      { url = '/', params = {} }: { url?: string; params?: RequestInit } = {},
      cb: (x: any) => void,
    ) => {
      setTimeout(async () => {
        const res = await fetch(
          `http://localhost:8080/${url}`,
          params,
        )
        const text = await res.json()
        cb(text)
        Deno.close(8)
        listener.close()
      })
      await serve()
    },
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
