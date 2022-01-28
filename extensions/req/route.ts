import { App } from '../../app.ts'
import { Handler, Middleware } from '../../deps.ts'
import { THRequest } from '../../request.ts'
import { THResponse } from '../../response.ts'

export const getRouteFromApp = (
  { middleware }: App,
  h: Handler<THRequest, THResponse>
): Middleware<THRequest, THResponse> =>
  middleware.find(({ handler }) => typeof handler === 'function' && handler.name === h.name)!
