import { Req, Res } from '../../deps.ts'
import { send } from './send.ts'
import { QueryParams } from '../../types.ts'

export type JSONPOptions = Partial<{
  escape: boolean
  replacer: ((this: any, key: string, value: any) => any) | undefined
  spaces: string | number
  callbackName: string
}>

function stringify(
  value: unknown,
  replacer: JSONPOptions['replacer'],
  spaces: JSONPOptions['spaces'],
  escape: JSONPOptions['escape']
) {
  let json = replacer || spaces ? JSON.stringify(value, replacer, spaces) : JSON.stringify(value)

  if (escape) {
    json = json.replace(/[<>&]/g, (c) => {
      switch (c.charCodeAt(0)) {
        case 0x3c:
          return '\\u003c'
        case 0x3e:
          return '\\u003e'
        case 0x26:
          return '\\u0026'
        default:
          return c
      }
    })
  }

  return json
}

type R = Req & { query: QueryParams }

/**
 * Send JSON response with JSONP callback support
 * @param req Request
 * @param res Response
 * @param app App
 */
export const jsonp = <Request extends R = R, Response extends Res = Res>(req: Request, res: Response) => (
  obj: unknown,
  opts: JSONPOptions = {}
) => {
  const val = obj

  const { escape, replacer, spaces, callbackName = 'callback' } = opts

  let body = stringify(val, replacer, spaces, escape)

  let callback = req.query[callbackName]

  if (!res.headers?.get('Content-Type')) {
    res.headers?.set('X-Content-Type-Options', 'nosniff')
    res.headers?.set('Content-Type', 'application/json')
  }

  // jsonp
  if (typeof callback === 'string' && callback.length !== 0) {
    res.headers?.set('X-Content-Type-Options', 'nosniff')
    res.headers?.set('Content-Type', 'text/javascript')

    // restrict callback charset
    callback = callback.replace(/[^[\]\w$.]/g, '')

    // replace chars not allowed in JavaScript that are in JSON
    body = body.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

    // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
    // the typeof check is just to reduce client error noise
    body = `/**/ typeof ${callback} === 'function' && ${callback}(${body});`
  }

  return send(req, res)(body)
}
