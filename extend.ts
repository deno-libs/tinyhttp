import { App } from './app.ts'
import { NextFunction } from './deps.ts'
import { end } from './extensions/res/end.ts'
import { THRequest } from './request.ts'
import { ResponseState } from './response.ts'

export const extend = (app: App) => (req: THRequest, res: ResponseState, next: NextFunction) => {
  res.end = end(res)

  next()
}
