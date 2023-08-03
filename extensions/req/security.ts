import { all, compile, isIP, proxyaddr } from '../../deps.ts'
import type { ReqWithUrlAndConn } from '../../request.ts'
import type { Protocol } from '../../types.ts'

const trustRemoteAddress = (
  conn: Deno.Conn,
) => {
  const val = (conn.remoteAddr as Deno.NetAddr).hostname

  if (typeof val === 'string') {
    return compile(val.split(',').map((x) => x.trim()))
  }

  return compile(val)
}

export const getProtocol = <Req extends ReqWithUrlAndConn = ReqWithUrlAndConn>(
  req: Req,
): Protocol => {
  return req._urlObject.protocol?.includes('https') ? 'https' : 'http'
}

export const getHostname = <Req extends ReqWithUrlAndConn = ReqWithUrlAndConn>(
  req: Req,
): string | undefined => {
  let host: string = req.headers.get('X-Forwarded-Host') as string

  if (!host || !trustRemoteAddress(req.conn)) {
    host = req.headers.get('Host') as string
  }
  if (!host) return req._urlObject.hostname

  // IPv6 literal support
  const index = host.indexOf(':', host[0] === '[' ? host.indexOf(']') + 1 : 0)

  return index !== -1 ? host.substring(0, index) : host
}

export const getIP = <Req extends ReqWithUrlAndConn = ReqWithUrlAndConn>(
  req: Req,
) => proxyaddr(req, trustRemoteAddress(req.conn))?.replace(/^.*:/, '') // striping the redundant prefix addeded by OS to IPv4 address

export const getIPs = <Req extends ReqWithUrlAndConn = ReqWithUrlAndConn>(
  req: Req,
): string[] => all(req, trustRemoteAddress(req.conn))

export const getSubdomains = <
  Req extends ReqWithUrlAndConn = ReqWithUrlAndConn,
>(
  req: Req,
  subdomainOffset = 2,
): string[] => {
  const hostname = getHostname(req)

  if (!hostname) return []

  const subdomains = isIP(hostname) ? [hostname] : hostname.split('.').reverse()

  return subdomains.slice(subdomainOffset)
}
