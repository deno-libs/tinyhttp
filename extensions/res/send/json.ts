import { DummyResponse } from '../../../response.ts'

export const json =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  <T = unknown>(body: T): Res => {
    if (typeof body === 'object' && body != null) {
      res._init.headers.set('Content-Type', 'application/json')
      res._body = JSON.stringify(body, null, 2)
    } else if (typeof body === 'string') res._body = body
    else if (body == null) {
      res._init.headers.delete('Content-Length')
      res._init.headers.delete('Transfer-Encoding')
      res._body = undefined
    }

    return res
  }
