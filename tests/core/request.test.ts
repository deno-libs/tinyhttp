import { describe, it, run } from 'https://deno.land/x/tincan@1.0.1/mod.ts'
import { initAppAndTest } from '../util.ts'

describe('Request properties', () => {
  it('should have default HTTP Request properties', async () => {
    const { fetch } = initAppAndTest((req, res) => {
      res.json({
        url: req.url,
      })
    })
    const res = await fetch('/')
    res.expectBody({ url: 'http://localhost:8080/' })
  })

  describe('URL extensions', () => {
    it('req.query is being parsed properly', async () => {
      const { fetch } = initAppAndTest((req, res) => {
        const query: Record<string, string> = {}
        for (const [k, v] of req.query.entries()) query[k] = v
        res.json(query)
      })

      const res = await fetch('/?param1=val1&param2=val2')

      res.expectStatus(200).expect({
        param1: 'val1',
        param2: 'val2',
      })
    })
    it('req.params is being parsed properly', async () => {
      const { fetch } = initAppAndTest(
        (req, res) => {
          res.json(req.params)
        },
        '/:param1/:param2',
        {},
        'get',
      )

      const res = await fetch('/val1/val2')

      res.expectStatus(200).expect({
        param1: 'val1',
        param2: 'val2',
      })
    })
  })

  describe('Network extensions', () => {
    it('req.ip & req.ips is being parsed properly', async () => {
      const { fetch } = initAppAndTest(
        (req, res) => {
          res.json({
            ip: req.ip,
            ips: req.ips,
          })
        },
        '/',
        {},
        'get',
      )

      const res = await fetch('/')

      res.expectStatus(200).expectBody({
        ip: '1',
        ips: ['::1'],
      })
    })
    it('req.protocol is http by default', async () => {
      const { fetch } = initAppAndTest(
        (req, res) => {
          res.end(`protocol: ${req.protocol}`)
        },
        '/',
        {
          settings: {},
        },
        'get',
      )
      const res = await fetch('/')
      res.expectStatus(200).expectBody(`protocol: http`)
    })
    it('req.secure is false by default', async () => {
      const { fetch } = initAppAndTest(
        (req, res) => {
          res.end(`secure: ${req.secure}`)
        },
        '/',
        {},
        'get',
      )
      const res = await fetch('/')

      res.expect(`secure: false`).expectStatus(200)
    })
    it('req.subdomains is empty by default', async () => {
      const { fetch } = initAppAndTest(
        (req, res) => {
          res.end(`subdomains: ${req.subdomains?.join(', ')}`)
        },
        '/',
        {},
        'get',
      )
      const res = await fetch('/')
      res.expect('subdomains: ')
    })
  })

  it('req.xhr is false because of superfetch', async () => {
    const { fetch } = initAppAndTest((req, res) => {
      res.end(`XMLHttpRequest: ${req.xhr ? 'yes' : 'no'}`)
    })

    const res = await fetch('/')
    res.expectStatus(200).expectBody('XMLHttpRequest: no')
  })

  it('req.path is the URL but without query parameters', async () => {
    const { fetch } = initAppAndTest((req, res) => {
      res.end(`Path to page: ${req.path}`)
    })
    const res = await fetch('/page')
    res.expect(`Path to page: /page`)
  })
  it('req.path works properly for optional parameters', async () => {
    const { fetch } = initAppAndTest(
      (req, res) => {
        res.end(`Path to page: ${req.path}`)
      },
      '/:format?/:uml?',
      {},
      'get',
    )

    const res = await fetch('/page/page-1')
    res.expect(`Path to page: /page/page-1`)
  })
  it('req.fresh and req.stale get set', async () => {
    const etag = '123'
    const { fetch } = initAppAndTest(
      async (_req, res) => {
        res.set('ETag', etag)
        await res.send('stale')
      },
      '/',
      {},
      'get',
    )
    const res = await fetch('/', { headers: { 'If-None-Match': etag } })
    res.expectStatus(304)
  })
})

run()
