import { end } from './extensions/res/send/end.ts'
import { send } from './extensions/res/send/send.ts'
import { sendFile } from './extensions/res/send/sendFile.ts'
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
  res.end = end(res)
  res.send = send(req, res)
  res.sendFile = sendFile(req, res)

  next()
}
