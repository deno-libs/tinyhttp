import type { NextFunction } from './deps.ts'
import { App } from './app.ts'
import { renderTemplate } from './utils/template.ts'
import { THRequest } from './request.ts'
import {
  getRequestHeader,
  getFreshOrStale,
  getAccepts,
  getAcceptsCharsets,
  getAcceptsEncodings,
  getAcceptsLanguages,
  checkIfXMLHttpRequest,
  getHostname,
  getIP,
  getIPs,
  getProtocol,
  getSubdomains,
  getRangeFromHeader,
  reqIs
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
  clearCookie,
  redirect
} from './extensions/res/mod.ts'
import { getQueryParams } from './utils/parseUrl.ts'
import { THResponse } from './response.ts'

export const extendMiddleware =
  <RenderOptions = unknown, Req extends THRequest = THRequest, Res extends THResponse = THResponse>(app: App) =>
  (req: Req, res: Res, next: NextFunction) => {
    const { settings } = app

    res.locals = res.locals || Object.create(null)

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

    req.accepts = getAccepts(req)
    req.acceptsCharsets = getAcceptsCharsets(req)
    req.acceptsEncodings = getAcceptsEncodings(req)
    req.acceptsLanguages = getAcceptsLanguages(req)

    req.range = getRangeFromHeader(req)
    req.xhr = checkIfXMLHttpRequest(req)
    req.is = reqIs(req)

    if (settings?.networkExtensions) {
      req.protocol = getProtocol<Req>(req)
      req.secure = req.protocol === 'https'
      req.hostname = getHostname<Req>(req)
      req.subdomains = getSubdomains<Req>(req, settings.subdomainOffset)
      req.ip = getIP<Req>(req)
      req.ips = getIPs<Req>(req)
    }

    // Response extensions

    res.end = end(res)
    res.send = send<Req, Res>(req, res)
    res.sendFile = sendFile<Req, Res>(req, res)
    res.sendStatus = sendStatus(res)
    res.json = json<Res>(res)
    res.setHeader = setHeader<Res>(res)
    res.set = setHeader<Res>(res)
    res.location = setLocationHeader<Req, Res>(req, res)
    res.get = getResponseHeader<Res>(res)
    res.append = append<Res>(res)
    res.render = renderTemplate<RenderOptions, Res>(res, app)
    res.links = setLinksHeader<Res>(res)
    res.redirect = redirect<Req, Res, NextFunction>(req, res, next)
    res.type = setContentType<Res>(res)
    res.format = formatResponse<Req, Res>(req, res, next)
    res.vary = setVaryHeader<Res>(res)
    res.download = download<Req, Res>(req, res)
    res.attachment = attachment<Res>(res)

    res.cookie = setCookie<Res>(res)
    res.clearCookie = clearCookie<Res>(res)

    Object.defineProperty(req, 'fresh', { get: getFreshOrStale.bind(null, req, res), configurable: true })
    req.stale = !req.fresh

    next?.()
  }
