import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { App } from './app.ts'
import { Request } from './request.ts'
import {
  getRequestHeader,
  getFreshOrStale,
  getAccepts,
  getAcceptsCharsets,
  getAcceptsEncodings,
  getAcceptsLanguages,
  getRangeFromHeader,
  checkIfXMLHttpRequest,
  reqIs,
  getHostname,
  getIP,
  getIPs,
  getProtocol,
  getSubdomains
} from './extensions/req/mod.ts'
import {
  send,
  json,
  sendStatus,
  setHeader,
  setLocationHeader,
  end,
  sendFile,
  getResponseHeader,
  append,
  setLinksHeader,
  setContentType,
  formatResponse,
  setVaryHeader,
  attachment,
  download,
  setCookie,
  clearCookie
} from './extensions/res/mod.ts'
import { getQueryParams } from './utils/parseUrl.ts'
import { Response, renderTemplate } from './response.ts'

export const extendMiddleware = <
  RenderOptions = unknown,
  Req extends Request = Request,
  Res extends Response = Response
>(
  app: App
) => (req: Req, res: Res, next: NextFunction) => {
  const { settings } = app

  // Request extensions
  if (settings?.bindAppToReqRes) {
    req.app = app
    res.app = app
  }

  req.query = getQueryParams(req.url)

  req.connection = {
    remoteAddress: (req.conn.remoteAddr as Deno.NetAddr).hostname
  }

  req.get = getRequestHeader(req)

  if (settings?.freshnessTesting) {
    req.fresh = getFreshOrStale(req, res)
    req.stale = !req.fresh
  }

  req.accepts = getAccepts(req)
  req.acceptsCharsets = getAcceptsCharsets(req)
  req.acceptsEncodings = getAcceptsEncodings(req)
  req.acceptsLanguages = getAcceptsLanguages(req)

  req.range = getRangeFromHeader(req)
  req.xhr = checkIfXMLHttpRequest(req)
  req.is = reqIs(req)

  if (settings?.networkExtensions) {
    req.protocol = getProtocol(req)
    req.secure = req.protocol === 'https'
    req.hostname = getHostname(req)
    req.subdomains = getSubdomains(req, settings.subdomainOffset)
    req.ip = getIP(req)
    req.ips = getIPs(req)
  }

  // Response extensions

  res.end = end(req, res)
  res.send = send<Req, Res>(req, res)
  res.sendFile = sendFile<Req, Res>(req, res)
  res.sendStatus = sendStatus(req, res)
  res.json = json<Res>(res)
  res.setHeader = setHeader<Res>(res)
  res.set = setHeader<Res>(res)
  res.location = setLocationHeader<Req, Res>(req, res)
  res.get = getResponseHeader<Res>(res)
  res.append = append<Res>(res)
  res.render = renderTemplate<RenderOptions, Res>(res, app)
  res.links = setLinksHeader<Res>(res)
  res.type = setContentType<Res>(res)
  res.format = formatResponse<Req, Res>(req, res, next)
  res.vary = setVaryHeader<Res>(res)
  res.download = download<Req, Res>(req, res)
  res.attachment = attachment<Res>(res)

  res.cookie = setCookie<Req, Res>(req, res)
  res.clearCookie = clearCookie<Res>(res)

  next?.()
}
