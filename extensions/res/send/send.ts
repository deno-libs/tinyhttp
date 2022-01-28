import type { THResponse } from '../../../response.ts'
import type { THRequest } from '../../../request.ts'
import { json } from './json.ts'
import { createETag, setCharset } from '../utils.ts'
import { end } from './end.ts'

export const send =
  <Request extends THRequest = THRequest, Response extends THResponse = THResponse>(req: Request, res: Response) =>
  (body: any) => {
    let bodyToSend = body

    // in case of object - turn it to json
    if (typeof bodyToSend === 'object' && bodyToSend !== null) {
      bodyToSend = JSON.stringify(body, null, 2)
    } else {
      if (typeof bodyToSend === 'string') {
        // reflect this in content-type
        const type = res.headers?.get('Content-Type')

        if (type && typeof type === 'string') {
          res.headers?.set('Content-Type', setCharset(type, 'utf-8'))
        } else res.headers?.set('Content-Type', setCharset('text/html', 'utf-8'))
      }
    }

    // populate ETag
    let etag: string | undefined
    if (bodyToSend && !res.headers?.get('etag') && (etag = createETag(bodyToSend as string))) {
      res.headers?.set('etag', etag)
    }

    // freshness
    // @ts-ignore
    if (req.fresh) res.status = 304

    // strip irrelevant headers
    if (res.status === 204 || res.status === 304) {
      res.headers?.delete('Content-Type')
      res.headers?.delete('Content-Length')
      res.headers?.delete('Transfer-Encoding')
      bodyToSend = ''
    }

    if (req.method === 'HEAD') {
      return end(res)(bodyToSend)
    }

    if (typeof bodyToSend === 'object') {
      if (body == null) {
        return end(res)('')
      } else if (bodyToSend instanceof Uint8Array || bodyToSend instanceof File) {
        if (!res.headers?.get('Content-Type')) res.headers.set('content-type', 'application/octet-stream')

        return end(res)(bodyToSend)
      } else {
        return json(res)(bodyToSend)
      }
    } else {
      if (typeof bodyToSend !== 'string') bodyToSend = (bodyToSend as string).toString()

      return end(res)(bodyToSend)
    }
  }
