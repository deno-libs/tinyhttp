import { charset, encodeUrl, lookup, vary } from '../../deps.ts'
import { THRequest } from '../../request.ts'
import { THResponse } from '../../response.ts'
import { getRequestHeader } from '../req/headers.ts'

const charsetRegExp = /;\s*charset\s*=/

export const setHeader =
  <Response extends THResponse = THResponse>(res: Response) =>
  (
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[],
  ): Response => {
    if (typeof field === 'string') {
      let value = Array.isArray(val) ? val.map(String) : String(val)

      // add charset to content-type
      if (field.toLowerCase() === 'content-type') {
        if (Array.isArray(value)) {
          throw new TypeError('Content-Type cannot be set to an Array')
        }

        if (!charsetRegExp.test(value)) {
          const ch = charset(value.split(';')[0])

          if (typeof ch === 'string') value += '; charset=' + ch.toLowerCase()
        }
      }

      res.headers.set(field, value as string)
    } else {
      for (const key in field) {
        setHeader(res)(key, field[key] as string)
      }
    }
    return res
  }

export const getResponseHeader =
  <Response extends THResponse = THResponse>(res: Response) =>
  (field: string) => {
    return res.headers?.get(field)
  }

export const setLocationHeader = <
  Request extends THRequest = THRequest,
  Response extends THResponse = THResponse,
>(req: Request, res: Response) =>
(url: string): Response => {
  let loc = url

  // "back" is an alias for the referrer
  if (url === 'back') {
    loc = (getRequestHeader(req)('Referrer') as string) || '/'
  }

  // set location
  res.headers.set('Location', encodeUrl(loc))
  return res
}

export const setLinksHeader =
  <Response extends THResponse = THResponse>(res: Response) =>
  (links: { [key: string]: string }): Response => {
    let link = res.headers?.get('Link') || ''
    if (link) link += ', '
    res.headers.set(
      'Link',
      link +
        Object.keys(links)
          .map((rel) => '<' + links[rel] + '>; rel="' + rel + '"')
          .join(', '),
    )

    return res
  }

export const setVaryHeader =
  <Response extends THResponse = THResponse>(res: Response) =>
  (field: string): Response => {
    vary(res.headers || new Headers({}), field)

    return res
  }

export const setContentType =
  <Response extends THResponse = THResponse>(res: Response) =>
  (type: string): Response => {
    const ct = type.indexOf('/') === -1 ? lookup(type) : type

    setHeader(res)('Content-Type', ct)

    return res
  }
