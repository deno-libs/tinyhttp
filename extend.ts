import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { App } from './app.ts'
import { Request } from './request.ts'
import { getRequestHeader, getFreshOrStale } from './extensions/req/headers.ts'
import { send } from './extensions/res/send.ts'
import { Response } from './response.ts'

export const extendMiddleware = <
  RenderOptions = unknown,
  Req extends Request = Request,
  Res extends Response = Response
>(
  app: App
) => (req: Req, res: Res, next?: NextFunction) => {
  const { settings } = app

  // Request extensions
  if (settings?.bindAppToReqRes) {
    req.app = app
  }

  req.get = getRequestHeader(req)

  if (settings?.freshnessTesting) {
    req.fresh = getFreshOrStale(req, res)
    req.stale = !req.fresh
  }

  res.send = send(req, res)

  next?.()
}
