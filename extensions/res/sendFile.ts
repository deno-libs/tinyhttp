import { Response as Res } from '../../response.ts'
import { isAbsolute, join } from 'https://deno.land/std/path/mod.ts'

export type SendFileOptions = Partial<{
  root: string
  headers: Record<string, any>
}> &
  Deno.OpenOptions

/**
 * Sends a file by piping a stream to response.
 *
 * It also checks for extension to set a proper `Content-Type` header.
 *
 * Path argument must be absolute. To use a relative path, specify the `root` option first.
 *
 * @param res Response
 */
export const sendFile = <Response extends Res = Res>(res: Response) => (
  path: string,
  opts: SendFileOptions = {},
  cb?: (err?: unknown) => void
) => {
  const { root, headers, ...options } = opts

  if (!path || typeof path !== 'string') throw new TypeError('path must be a string to res.sendFile')

  if (headers) for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)

  if (!isAbsolute(path) && !root) throw new TypeError('path must be absolute')

  const filePath = root ? join(root, path) : path

  res.set('Content-Type', 'text/html; charset=UTF-8')
  res.set('Content-Security-Policy', "default-src 'none'")
  res.set('X-Content-Type-Options', 'nosniff')

  const file = Deno.openSync(filePath, { read: true, ...options })

  res.send(file)

  return res
}
