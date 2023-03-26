import { App } from './app.ts'
import { getRequestHeader } from './extensions/req/headers.ts'
import {
  checkIfXMLHttpRequest,
  getAccepts,
  getAcceptsCharsets,
  getAcceptsEncodings,
  getAcceptsLanguages,
  getFreshOrStale,
  getHostname,
  getIP,
  getIPs,
  getProtocol,
  getSubdomains,
  reqIs,
} from './extensions/req/mod.ts'
import { getResponseHeader, setHeader } from './extensions/res/headers.ts'
import {
  append,
  attachment,
  clearCookie,
  end,
  formatResponse,
  json,
  redirect,
  send,
  sendFile,
  sendStatus,
  setCookie,
  setLinksHeader,
  setLocationHeader,
  setVaryHeader,
  status,
} from './extensions/res/mod.ts'
import type { THRequest } from './request.ts'
import { renderTemplate, THResponse } from './response.ts'
import type { NextFunction } from './types.ts'

/**
 * Extends Request and Response objects with custom properties and methods
 */
export const extendMiddleware = <EngineOptions>(app: App<EngineOptions>) =>
(
  req: THRequest,
  res: THResponse<EngineOptions>,
  next: NextFunction,
): void => {
  // Request
  req.accepts = getAccepts(req)
  req.path = req._urlObject.pathname
  req.acceptsCharsets = getAcceptsCharsets(req)
  req.acceptsEncodings = getAcceptsEncodings(req)
  req.acceptsLanguages = getAcceptsLanguages(req)
  req.is = reqIs(req)
  req.xhr = checkIfXMLHttpRequest(req)
  req.protocol = getProtocol(req)
  req.hostname = getHostname(req)
  req.secure = req.protocol === 'https'
  // req.fresh = getFreshOrStale(req, res)
  // req.stale = !req.fresh
  req.ip = getIP(req)
  req.ips = getIPs(req)
  req.subdomains = getSubdomains(req, app.settings.subdomainOffset)
  req.get = getRequestHeader(req)

  // Response
  res.end = end(res)
  res.send = send(req, res)
  res.sendFile = sendFile(req, res)
  res.json = json(res)
  res.sendStatus = sendStatus(res)
  res.attachment = attachment(res)
  res.format = formatResponse(req, res, next)
  res.status = status(res)
  res.links = setLinksHeader(res)
  res.vary = setVaryHeader(res)
  res.redirect = redirect(req, res, next)
  res.append = append(res)
  res.render = renderTemplate<EngineOptions>(res, app)
  res.cookie = setCookie(res)
  res.clearCookie = clearCookie(res)
  res.location = setLocationHeader(req, res)
  res.get = getResponseHeader(res)
  res.header = setHeader(res)
  res.set = setHeader(res)

  next()
}
