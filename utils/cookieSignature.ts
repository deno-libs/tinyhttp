import { hmac } from 'https://denopkg.com/chiefbiiko/hmac/mod.ts'
import { Buffer } from 'https://deno.land/std@0.88.0/node/buffer.ts'

function timingSafeEqual(a: Buffer, b: Buffer) {
  var len = a.length
  var out = 0
  var i = -1
  while (++i < len) out |= a[i] ^ b[i]
  return out === 0
}

/**
 * Sign the given `val` with `secret`.
 */
export const sign = (val: string, secret: string) =>
  `${val}.${hmac('sha256', secret, val, 'base64').toString().replace(/=+$/, '')}`

/**
 * Unsign and decode the given `val` with `secret`,
 * returning `false` if the signature is invalid.
 */
export const unsign = (val: string, secret: string) => {
  const str = val.slice(0, val.lastIndexOf('.')),
    mac = sign(str, secret),
    macBuffer = Buffer.from(mac),
    valBuffer = Buffer.alloc(macBuffer.length)

  valBuffer.write(val)
  return timingSafeEqual(macBuffer, valBuffer) ? str : false
}
