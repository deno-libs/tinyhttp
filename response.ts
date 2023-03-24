import { SendFileOptions } from './extensions/res/send/sendFile.ts'

export interface THResponse<O = any, B = any> {
  _body?: BodyInit
  _init?: ResponseInit
  headers: Headers
  status: number
  send(body: B): THResponse<O, B>
  sendFile(path: string, opts?: SendFileOptions): THResponse<O, B>
  end(body?: BodyInit): THResponse<O, B>
}
