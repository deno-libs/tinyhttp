import type { ResponseState } from '../../../response.ts'
export const end = (res: ResponseState) => (body: string | undefined) => {
  res.body = body
  return res
}
