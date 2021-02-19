import * as qs from 'https://deno.land/std@0.88.0/node/querystring.ts'

export const pathname = (u: string) => {
  const end = u.indexOf('?')

  return u.slice(0, end === -1 ? u.length : end)
}

export const parse = (url: string) => {
  const path = pathname(url)

  const query = qs.parse(url.slice(url.indexOf('?')))

  return { pathname: path, query }
}
