import { base64 } from '../deps.ts'
const encoder = new TextEncoder()

const entityTag = async (entity: string): Promise<string> => {
  if (entity.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
  } else {
    // generate hash
    const data = encoder.encode(entity)
    const buf = await crypto.subtle.digest('SHA-1', data)
    const hash = base64.encode(buf).slice(0, 27)
    const len = data.byteLength

    return '"' + len.toString(16) + '-' + hash + '"'
  }
}

const statTag = ({ mtime, size }: Deno.FileInfo): string => {
  return '"' + mtime!.getTime().toString(16) + '-' + size.toString(16) + '"'
}

export const eTag = async (
  entity: string | Deno.FileInfo,
  options?: { weak: boolean },
): Promise<string> => {
  if (entity == null) throw new TypeError('argument entity is required')

  const weak = options?.weak || typeof entity !== 'string'

  // generate entity tag

  const tag = typeof entity === 'string'
    ? await entityTag(entity)
    : statTag(entity)

  return weak ? 'W/' + tag : tag
}
