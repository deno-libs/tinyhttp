import { App } from './app.ts'
import { getRequestHeader } from './extensions/req/headers.ts'
import {
  checkIfXMLHttpRequest,
  getAccepts,
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
import {
  append,
  attachment,
  clearCookie,
  cookie,
  end,
  formatResponse,
  getResponseHeader,
  json,
  redirect,
  send,
  sendFile,
  sendStatus,
  setContentType,
  setHeader,
  setLinksHeader,
  setLocationHeader,
  setVaryHeader,
  status,
} from './extensions/res/mod.ts'
import type { THRequest } from './request.ts'
import { THResponse } from './response.ts'
import type { NextFunction } from './types.ts'
import { CookieMap } from './deps.ts'
import { renderTemplate } from './utils/template.ts'

/**
 * Extends Request and Response objects with custom properties and methods
 */
export const extendMiddleware = <EngineOptions>(app: App<EngineOptions>) =>
  async function extend(
    req: THRequest,
    res: THResponse<EngineOptions>,
    next: NextFunction,
  ): Promise<void> {
    if (app.settings?.bindAppToReqRes) {
      req.app = app
      res.app = app
    }

    // Request
    req.accepts = getAccepts(req)
    req.path = req._urlObject.pathname
    // req.acceptsCharsets = getAcceptsCharsets(req)
    req.acceptsEncodings = getAcceptsEncodings(req)
    req.acceptsLanguages = getAcceptsLanguages(req)
    req.is = reqIs(req)
    req.xhr = checkIfXMLHttpRequest(req)
    req.protocol = getProtocol(req)
    req.hostname = getHostname(req)
    req.secure = req.protocol === 'https'
    Object.defineProperty(req, 'fresh', {
      get: getFreshOrStale.bind(null, req, res),
    })
    req.stale = !req.fresh
    req.ip = getIP(req)
    req.ips = getIPs(req)
    req.subdomains = getSubdomains(req, app.settings.subdomainOffset)
    req.get = getRequestHeader(req)
    req.query = req._urlObject.searchParams
    req.cookies = new CookieMap(req.headers)

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
    res.cookie = cookie(res)
    res.clearCookie = clearCookie(res)
    res.location = setLocationHeader(req, res)
    res.get = getResponseHeader(res)
    res.header = setHeader(res)
    res.set = setHeader(res)
    res.type = setContentType(res)

    await next()
  }
