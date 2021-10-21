import type { THResponse } from '../../../response.ts'
export const end = (res: THResponse) => (body: BodyInit | number | boolean | null | undefined) => {
  if (typeof body === 'number' || typeof body === 'boolean') body = body.toString()

  res.body = body
  return res
}
