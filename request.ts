type URLParams = Record<string, string | string[] | undefined>

export interface THRequest extends Request {
  _url: string
  originalUrl: string
  params: URLParams
  path: string
  query: URLParams
}
