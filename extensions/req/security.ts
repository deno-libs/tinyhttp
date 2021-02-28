import { isIP } from 'https://deno.land/x/isIP/mod.ts'
import { Request } from '../../request.ts'
import { compile, proxyaddr, all } from '../../utils/proxyAddr.ts'
import { Protocol } from '../../request.ts'

export const trustRemoteAddress = (req: Request) => {
  const val = (req.conn.remoteAddr as Deno.NetAddr).hostname

  if (typeof val === 'function') return val

  if (typeof val === 'boolean' && val === true) return () => true

  if (typeof val === 'number') return (_: unknown, i: number) => (val ? i < val : undefined)

  if (typeof val === 'string') return compile(val.split(',').map((x) => x.trim()))

  return compile(val)
}

export const getProtocol = (req: Request): Protocol => {
  const proto = req.proto.includes('https') ? 'https' : 'http'

  const header = (req.get('X-Forwarded-Proto') as string) ?? proto
  const index = header.indexOf(',')

  if (!trustRemoteAddress(req)) return proto

  // Note: X-Forwarded-Proto is normally only ever a
  // single value, but this is to be safe.

  return (index !== -1 ? header.substring(0, index).trim() : header.trim()) as Protocol
}

export const getHostname = (req: Request): string | undefined => {
  let host: string = req.get('X-Forwarded-Host') as string

  if (!host || !trustRemoteAddress(req)) {
    host = (req.get('Host') as string) || (req.conn.remoteAddr as Deno.NetAddr).hostname
  }

  if (!host) return

  // IPv6 literal support
  const index = host.indexOf(':', host[0] === '[' ? host.indexOf(']') + 1 : 0)

  return index !== -1 ? host.substring(0, index) : host
}
export const getIP = (req: Request): string | undefined => proxyaddr(req, trustRemoteAddress(req))?.replace(/^.*:/, '') // striping the redundant prefix addeded by OS to IPv4 address

export const getIPs = (req: Request): string[] | undefined => all(req, trustRemoteAddress(req))

export const getSubdomains = (req: Request, subdomainOffset = 2): string[] => {
  const hostname = getHostname(req)

  if (!hostname) return []

  const subdomains = isIP(hostname) ? [hostname] : hostname.split('.').reverse()

  return subdomains.slice(subdomainOffset)
}
