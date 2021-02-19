import { ServerRequest } from 'https://deno.land/std@0.87.0/http/server.ts'
import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { ALL as STATUS_CODES } from 'https://deno.land/x/status@0.1.0/codes.ts'
import { status } from 'https://deno.land/x/status@0.1.0/status.ts'
import { Buffer } from 'https://deno.land/std@0.77.0/node/buffer.ts'

export type ServerError = Partial<{
  code: number
  status: number
  message: string
}>

export type ErrorHandler = (err: ServerError, req: ServerRequest, next?: NextFunction) => void

export const onErrorHandler: ErrorHandler = async (err: ServerError, req: ServerRequest) => {
  let code = 500

  if (err.code && err.code in STATUS_CODES) code = err.code
  else if (err.status) code = err.status

  if (typeof err === 'string' || Buffer.isBuffer(err)) {
    await req.respond({
      body: err,
      status: 500
    })
  } else if (code in STATUS_CODES) {
    await req.respond({
      body: status.message[code],
      status: 500
    })
  } else
    req.respond({
      status: 500,
      body: err.message
    })
}
