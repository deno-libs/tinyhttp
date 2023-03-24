import { qs } from '../deps.ts'

type Regex = {
  keys: string[] | boolean
  pattern: RegExp
}

export const getURLParams = (
  { pattern, keys }: Regex,
  reqUrl = '/',
): Record<string, string> => {
  const matches = pattern.exec(reqUrl)

  const params: Record<string, string> = {}

  if (matches && typeof keys !== 'boolean') {
    for (let i = 0; i < keys.length; i++) {
      params[keys[i]] = matches[i + 1]
    }
  }

  return params
}

export const getPathname = (u: string) => {
  const url = new URL(u)

  return url.pathname
}

export interface ParsedUrlQuery {
  [key: string]: string | string[] | undefined
}

export const getQueryParams = (url = '/'): ParsedUrlQuery =>
  qs.parse(url.slice(url.indexOf('?') + 1))
