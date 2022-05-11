export interface THResponse {
  init: ResponseInit
  bodyInit: BodyInit
  headers: Headers
  end(body: BodyInit | number | boolean | null | undefined): this
}
