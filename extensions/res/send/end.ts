import type { DummyResponse } from '../../../response.ts'
export const end = <Res extends DummyResponse = DummyResponse>(res: Res) =>
(
  body: BodyInit | number | boolean | null | undefined,
) => {
  if (typeof body === 'number' || typeof body === 'boolean') {
    body = body.toString()
  }

  if (body) res._body = body

  return res
}
