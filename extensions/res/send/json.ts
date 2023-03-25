import { THResponse } from '../../../response.ts'

export const json =
  <Response extends THResponse = THResponse>(res: Response) =>
  <T = unknown>(body: T): Response => {
    res._init.headers.set('Content-Type', 'application/json')
    if (typeof body === 'object' && body != null) {
      res.end(JSON.stringify(body, null, 2))
    } else if (typeof body === 'string') res.end(body)
    else if (body == null) {
      res._init.headers.delete('Content-Length')
      res._init.headers.delete('Transfer-Encoding')
      res.end(undefined)
    }

    return res
  }
