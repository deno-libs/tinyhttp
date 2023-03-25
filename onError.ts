import { STATUS_CODES } from './constants.ts'

export const onErrorHandler = (err: unknown) => {
  if (err instanceof Error) console.error(err)

  const error = err as Error & { code?: number; status?: number }

  if (typeof err === 'string') return new Response(err, { status: 500 })
  else if (error.code! in STATUS_CODES) {
    return new Response(STATUS_CODES[error.code!], { status: error.code })
  } else return new Response(error.message, { status: 500 })
}
