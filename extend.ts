import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { App } from './app.ts'
import { Request } from './request.ts'

export const extendMiddleware = <RenderOptions = unknown>(app: App) => (req: Request, next: NextFunction) => {
  const { settings } = app

  if (settings?.bindAppToReqRes) {
    req.app = app
  }
  next()
}
