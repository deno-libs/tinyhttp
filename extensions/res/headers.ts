import { encodeUrl, getCharset, typeByExtension, vary } from '../../deps.ts'
import { DummyResponse } from '../../response.ts'
import { getRequestHeader } from '../req/headers.ts'

const charsetRegExp = /;\s*charset\s*=/

export const setHeader =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[],
  ): Res => {
    if (typeof field === 'string') {
      let value = Array.isArray(val) ? val.map(String) : String(val)

      // add charset to content-type
      if (field.toLowerCase() === 'content-type') {
        if (Array.isArray(value)) {
          throw new TypeError('Content-Type cannot be set to an Array')
        }

        if (!charsetRegExp.test(value)) {
          const ch = getCharset(value.split(';')[0])

          if (typeof ch === 'string') value += '; charset=' + ch.toLowerCase()
        }
      }

      res._init.headers.set(field, value as string)
    } else {
      for (const key in field) {
        setHeader(res)(key, field[key] as string)
      }
    }
    return res
  }

export const getResponseHeader =
  <Res extends DummyResponse = DummyResponse>(res: Res) => (field: string) =>
    res._init.headers?.get(field)

export const setLocationHeader = <
  Res extends DummyResponse = DummyResponse,
>(req: Request, res: Res) =>
(url: string): Res => {
  let loc = url

  // "back" is an alias for the referrer
  if (url === 'back') {
    loc = (getRequestHeader(req)('Referrer') as string) || '/'
  }

  // set location
  res._init.headers.set('Location', encodeUrl(loc))
  return res
}

export const setLinksHeader =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (links: { [key: string]: string }): Res => {
    let link = res._init.headers?.get('Link') || ''
    if (link) link += ', '
    res._init.headers.set(
      'Link',
      link +
        Object.keys(links)
          .map((rel) => '<' + links[rel] + '>; rel="' + rel + '"')
          .join(', '),
    )

    return res
  }

export const setVaryHeader =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (field: string): Res => {
    vary(res._init.headers || new Headers({}), field)

    return res
  }

export const setContentType =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (type: string): Res => {
    const ct = type.indexOf('/') === -1 ? typeByExtension(type) : type

    setHeader(res)('Content-Type', ct)

    return res
  }
