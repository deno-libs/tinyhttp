import { describe, expect, it, run } from '../../dev_deps.ts'
import { eTag } from '../../utils/eTag.ts'

describe('etag(entity)', () => {
  it('should require an entity', async () => {
    try {
      await eTag(undefined as unknown as string)
    } catch (e) {
      expect((e as TypeError).message).toBe('argument entity is required')
    }
  })
  it('should generate a strong ETag', async () => {
    expect(await eTag('beep boop')).toBe('"9-fINXV39R1PCo05OqGqr7KIY9lCE"')
  })
  it('should work for empty string', async () => {
    expect(await eTag('')).toBe('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
  it('should work containing Unicode', async () => {
    expect(await eTag('论')).toBe('"3-QkSKq8sXBjHL2tFAZknA2n6LYzM"')
    expect(await eTag('论', { weak: true })).toBe(
      'W/"3-QkSKq8sXBjHL2tFAZknA2n6LYzM"',
    )
  })
  describe('weak', () => {
    it('should generate a weak ETag', async () => {
      expect(await eTag('beep boop', { weak: true })).toBe(
        'W/"9-fINXV39R1PCo05OqGqr7KIY9lCE"',
      )
    })
    it('should generate a strong ETag', async () => {
      expect(await eTag('beep boop', { weak: false })).toBe(
        '"9-fINXV39R1PCo05OqGqr7KIY9lCE"',
      )
    })
  })
})

run()
