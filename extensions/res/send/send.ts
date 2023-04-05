import type { DummyResponse } from '../../../response.ts'
import { json } from './json.ts'
import { createETag, setCharset } from '../utils.ts'
import { end } from './end.ts'

export const send = <
  Req extends Request & { fresh?: boolean } = Request & { fresh?: boolean },
  Res extends DummyResponse = DummyResponse,
>(req: Req, res: Res) =>
async (body: unknown) => {
  let bodyToSend = body

  // in case of object - turn it to json
  if (typeof bodyToSend === 'object' && bodyToSend !== null) {
    bodyToSend = JSON.stringify(body, null, 2)
    res._init.headers?.set('Content-Type', 'application/json')
  } else {
    if (typeof bodyToSend === 'string') {
      // reflect this in content-type
      const type = res._init.headers?.get('Content-Type')

      if (type && typeof type === 'string') {
        res._init.headers?.set('Content-Type', setCharset(type))
      } else {res._init.headers?.set(
          'Content-Type',
          setCharset('text/html'),
        )}
    }
  }

  // populate ETag
  let etag: string | undefined
  if (
    bodyToSend && !res._init.headers?.get('etag') &&
    (etag = await createETag(bodyToSend as string))
  ) {
    res._init.headers?.set('etag', etag)
  }
  // freshness
  if (req.fresh) res._init.status = 304
  // strip irrelevant headers
  if (res._init.status === 204 || res._init.status === 304) {
    res._init.headers?.delete('Content-Type')
    res._init.headers?.delete('Content-Length')
    res._init.headers?.delete('Transfer-Encoding')
    bodyToSend = ''
  }

  if (req.method === 'HEAD') {
    return end(res)(bodyToSend as BodyInit)
  }

  if (typeof bodyToSend === 'object') {
    if (body == null) {
      return end(res)('')
    } else if (
      bodyToSend instanceof Uint8Array || bodyToSend instanceof File
    ) {
      if (!res._init.headers?.get('Content-Type')) {
        res._init.headers.set('content-type', 'application/octet-stream')
      }

      return end(res)(bodyToSend)
    } else {
      return json(res)(bodyToSend)
    }
  } else {
    if (typeof bodyToSend !== 'string') {
      bodyToSend = (bodyToSend as string).toString()
    }

    return end(res)(bodyToSend as BodyInit)
  }
}
