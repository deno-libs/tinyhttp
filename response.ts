export interface THResponse extends Response {}

export interface ResponseState extends ResponseInit {
  body: any
  end(body?: any): ResponseState
  json(body: Record<string, any>): ResponseState
  headers: Headers
}
