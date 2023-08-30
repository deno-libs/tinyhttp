import { contentType, path as _path } from '../../../deps.ts'
import { DummyResponse } from '../../../response.ts'
import { createETag } from '../utils.ts'
import { send } from './send.ts'

export type SendFileOptions =
  & Partial<{
    root: string
    headers: Record<string, string>
    encoding: string
    end: number
    start: number
  }>
  & Deno.ReadFileOptions

/**
 * Sends a file by piping a stream to response.
 *
 * It also checks for extension to set a proper `Content-Type` header.
 *
 * Path argument must be absolute. To use a relative path, specify the `root` option first.
 *
 * @param res Response
 */
export const sendFile = <
  Req extends Request = Request,
  Res extends DummyResponse = DummyResponse,
>(req: Req, res: Res) =>
async (
  path: string,
  { signal, ...opts }: SendFileOptions = {},
  cb?: (err?: unknown) => void,
) => {
  const { root, headers = {}, encoding = 'utf-8', ...options } = opts
  if (!_path.isAbsolute(path) && !root) {
    throw new TypeError('path must be absolute')
  }

  const filePath = root ? _path.join(root, path) : path
  const stats = await Deno.stat(filePath)

  headers['Content-Encoding'] = encoding

  headers['Last-Modified'] = stats.mtime!.toUTCString()

  headers['Content-Type'] = contentType(_path.extname(path)) || 'text/html'
  headers['ETag'] = await createETag(stats)

  headers['Content-Length'] = `${stats.size}`

  headers['Content-Security-Policy'] = 'default-src \'none\''
  headers['X-Content-Type-Options'] = 'nosniff'
  let status = 200

  if (req.headers.get('range')) {
    status = 206
    const [x, y] = req.headers?.get('range')?.replace('bytes=', '').split(
      '-',
    ) as [string, string]
    const end = (options.end = parseInt(y, 10) || stats.size - 1)
    const start = (options.start = parseInt(x, 10) || 0)

    if (start >= stats.size || end >= stats.size) {
      res._init.status = 416
      res._init.headers?.set('Content-Range', `bytes */${stats.size}`)

      res._body = undefined
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`
    headers['Content-Length'] = `${end - start + 1}`
    headers['Accept-Ranges'] = 'bytes'
  }

  for (const [k, v] of Object.entries(headers)) res._init.headers?.set(k, v)

  res._init.status = status

  let file
  try {
    file = await Deno.readFile(filePath, { signal })
  } catch (error) {
    cb!(error)
    file = null
  }
  await send(req, res)(file)

  return res
}
