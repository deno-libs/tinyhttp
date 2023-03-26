import { eTag } from '../../utils/eTag.ts'
import { typeByExtension,contentType } from '../../deps.ts'

export const createETag = async (body: string | Deno.FileInfo) => {
  return await eTag(body, { weak: true })
}

export function setCharset(type: string) {
  return contentType(type)!
}

export function acceptParams(str: string, index?: number) {
  const parts = str.split(/ *; */)
  const ret: {
    value: string
    quality: number
    params: Record<string, string>
    originalIndex?: number
  } = { value: parts[0], quality: 1, params: {}, originalIndex: index }

  for (const part of parts) {
    const pms = part.split(/ *= */)
    if ('q' === pms[0]) ret.quality = parseFloat(pms[1])
    else ret.params[pms[0]] = pms[1]
  }

  return ret
}

export const normalizeType = (type: string) =>
  ~type.indexOf('/')
    ? acceptParams(type)
    : { value: typeByExtension(type), params: {} }

export function normalizeTypes(types: string[]) {
  const ret = []

  for (const type of types) {
    ret.push(normalizeType(type))
  }

  return ret
}
