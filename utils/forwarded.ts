import { ServerRequest } from 'https://deno.land/std@0.88.0/http/server.ts'

/**
 * Get all addresses in the request, using the `X-Forwarded-For` header.
 *
 * @param req
 */
export function forwarded(req: ServerRequest) {
  if (!req) {
    throw new TypeError('argument req is required')
  }

  // simple header parsing
  const proxyAddrs = parse(req.headers.get('x-forwarded-for') ?? '')
  const { hostname: socketAddr } = req.conn.remoteAddr as Deno.NetAddr
  const addrs = [socketAddr].concat(proxyAddrs)

  // return all addresses
  return addrs
}

/**
 * Parse the X-Forwarded-For header.
 *
 * @param {string} header
 * @private
 */
function parse(header: string) {
  const list = []
  let start = header.length
  let end = header.length

  // gather addresses, backwards
  for (let i = header.length - 1; i >= 0; i--) {
    switch (header.charCodeAt(i)) {
      case 0x20 /*   */:
        if (start === end) {
          start = end = i
        }

        break
      case 0x2c /* , */:
        if (start !== end) {
          list.push(header.substring(start, end))
        }
        start = end = i

        break
      default:
        start = i

        break
    }
  }

  // final address
  if (start !== end) {
    list.push(header.substring(start, end))
  }

  return list
}
