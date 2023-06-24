import type { DummyResponse } from '../../../response.ts'
import { json } from './json.ts'
import { createETag, setCharset } from '../utils.ts'
import { end } from './end.ts'

const isBuffer = (body: unknown) =>
  body instanceof Uint8Array || body instanceof Blob ||
  body instanceof ArrayBuffer || body instanceof ReadableStream<Uint8Array>

export const send = <
  Req extends Request & { fresh?: boolean } = Request & { fresh?: boolean },
  Res extends DummyResponse = DummyResponse,
>(req: Req, res: Res) =>
async (body: unknown) => {
  let bodyToSend = body

  if (isBuffer(body)) {
    bodyToSend = body
  } else if (typeof body === 'object' && body !== null) {
    // in case of object - turn it to json
    bodyToSend = JSON.stringify(body, null, 2)
    res._init.headers?.set('Content-Type', 'application/json')
  } else if (typeof body === 'string') {
    // reflect this in content-type
    const type = res._init.headers.get('Content-Type')

    if (type && typeof type === 'string') {
      res._init.headers.set('Content-Type', setCharset(type))
    } else {res._init.headers.set(
        'Content-Type',
        setCharset('text/html'),
      )}
  }
  // populate ETag
  let etag: string | undefined
  if (
    typeof body === 'string' && !res._init.headers.get('etag')
  ) {
    etag = await createETag(bodyToSend as string)
  }
  {
    if (etag) res._init.headers.set('etag', etag!)
  }

  // freshness
  if (req.fresh) res._init.status = 304

  // strip irrelevant headers
  if (res._init.status === 204 || res._init.status === 304) {
    res._init.headers.delete('Content-Type')
    res._init.headers.delete('Content-Length')
    res._init.headers.delete('Transfer-Encoding')
    bodyToSend = ''
  }

  if (req.method === 'HEAD') {
    return end(res)(bodyToSend as BodyInit)
  }

  if (typeof body === 'object') {
    if (body == null) {
      return end(res)(null)
    } else if (isBuffer(body)) {
      if (!res._init.headers.get('Content-Type')) {
        res._init.headers.set('content-type', 'application/octet-stream')
      }
      return end(res)(bodyToSend as BodyInit)
    } else return json(res)(bodyToSend)
  }
  if (typeof bodyToSend !== 'string') {
    bodyToSend = (bodyToSend as string).toString()
  }
  return end(res)(bodyToSend as string)
}
