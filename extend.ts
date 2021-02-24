import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { App } from './app.ts'
import { Request } from './request.ts'
import { getRequestHeader, getFreshOrStale } from './extensions/req/headers.ts'
import { send } from './extensions/res/send.ts'
import { json } from './extensions/res/json.ts'
import { end } from './extensions/res/end.ts'
import { sendStatus } from './extensions/res/sendStatus.ts'
import { Response } from './response.ts'
import { setHeader, setLocationHeader } from './extensions/res/headers.ts'

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

  res.end = end(req, res)
  res.send = send<Req, Res>(req, res)
  res.sendStatus = sendStatus(req, res)
  res.json = json<Res>(res)

  res.setHeader = setHeader<Res>(res)
  res.set = setHeader<Res>(res)

  res.location = setLocationHeader<Req, Res>(req, res)

  next?.()
}
