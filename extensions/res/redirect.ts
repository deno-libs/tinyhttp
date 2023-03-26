import { formatResponse } from './format.ts'
import { setLocationHeader } from './headers.ts'
import { escapeHtml, getStatus } from '../../deps.ts'
import { THRequest } from '../../request.ts'
import { THResponse } from '../../response.ts'
import { NextFunction } from '../../types.ts'

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

  address = setLocationHeader(req, res)(address)._init.headers.get(
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

  res._init.headers.set('Content-Length', body.length.toString())

  res._init.status = status

  if (req.method === 'HEAD') {
    res._init.status = status
    res.end()
  } else {
    res.end(body)
  }

  return res
}
