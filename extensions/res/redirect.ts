import { formatResponse } from './format.ts'
import { setLocationHeader } from './headers.ts'
import { NextFunction } from '../../deps.ts'
import { status as getStatus } from 'https://deno.land/x/status@0.1.0/status.ts'
import { escapeHtml } from '../../deps.ts'
import { THRequest } from '../../request.ts'
import { THResponse } from '../../response.ts'

export const redirect = <
  Request extends THRequest = THRequest,
  Response extends THResponse = THResponse,
  Next extends NextFunction = NextFunction,
>(
  req: Request,
  res: Response,
  next: Next,
) =>
(url: string, status = 302) => {
  let address = url

  let body = ''

  address = setLocationHeader(req, res)(address).headers?.get(
    'Location',
  ) as string

  formatResponse(
    req,
    res,
    next,
  )({
    text: () => {
      body = getStatus(status) + '. Redirecting to ' + address
    },
    html: () => {
      const u = escapeHtml(address)

      body = `<p>${
        getStatus(status)
      }. Redirecting to <a href="${u}">${u}</a></p>`
    },
  })

  res.headers.set('Content-Length', body.length.toString())

  res.status = status

  if (req.method === 'HEAD') {
    res.status = status
    res.end()
  } else {
    res.end(body)
  }

  return res
}
