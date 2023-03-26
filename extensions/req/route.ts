import { Handler, Middleware } from '../../types.ts'

export const getRouteFromApp = (
  middleware: Middleware[],
  h: Handler,
): Middleware =>
  middleware.find(({ handler }) =>
    typeof handler === 'function' && handler.name === h.name
  )!
