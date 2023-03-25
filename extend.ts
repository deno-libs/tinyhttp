import {
  getAccepts,
  getAcceptsCharsets,
  getAcceptsEncodings,
  getAcceptsLanguages,
} from './extensions/req/accepts.ts'
import {
  checkIfXMLHttpRequest,
  getFreshOrStale,
  reqIs,
} from './extensions/req/headers.ts'
import { attachment } from './extensions/res/download.ts'
import { formatResponse } from './extensions/res/format.ts'
import { end } from './extensions/res/send/end.ts'
import { json } from './extensions/res/send/json.ts'
import { send } from './extensions/res/send/send.ts'
import { sendFile } from './extensions/res/send/sendFile.ts'
import { sendStatus } from './extensions/res/send/sendStatus.ts'
import { status } from './extensions/res/send/status.ts'
import type { THRequest } from './request.ts'
import type { THResponse } from './response.ts'
import type { NextFunction } from './types.ts'

/**
 * Extends Request and Response objects with custom properties and methods
 */
export const extendMiddleware = <EngineOptions>() =>
(
  req: THRequest,
  res: THResponse<EngineOptions>,
  next: NextFunction,
): void => {
  const u = new URL(req.url)
  // Request
  req.accepts = getAccepts(req)
  req.acceptsCharsets = getAcceptsCharsets(req)
  req.acceptsEncodings = getAcceptsEncodings(req)
  req.acceptsLanguages = getAcceptsLanguages(req)
  req.is = reqIs(req)
  req.xhr = checkIfXMLHttpRequest(req)
  req.protocol = u.protocol.slice(0, u.protocol.length - 1)
  // req.fresh = getFreshOrStale(req, res)
  // req.stale = !req.fresh

  // Response
  res.end = end(res)
  res.send = send(req, res)
  res.sendFile = sendFile(req, res)
  res.json = json(res)
  res.sendStatus = sendStatus(res)
  res.attachment = attachment(res)
  res.format = formatResponse(req, res, next)
  res.status = status(res)

  next()
}
