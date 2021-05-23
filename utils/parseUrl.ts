import { parse } from 'https://deno.land/std@0.97.0/node/querystring.ts'

type Regex = {
  keys: string[]
  pattern: RegExp
}

export const getURLParams = (r: Regex, reqUrl = '/'): URLParams => {
  const { pattern, keys } = r
  const matches = pattern.exec(reqUrl)

  const params: URLParams = {}

  if (matches) for (let i = 0; i < keys.length; i++) params[keys[i]] = matches[i + 1]

  return params
}

export type URLParams = {
  [key: string]: string
}

export const getPathname = (u: string) => {
  const end = u.indexOf('?')

  return u.slice(0, end === -1 ? u.length : end)
}

export const getQueryParams = (url = '/') => parse(url.slice(url.indexOf('?') + 1))
