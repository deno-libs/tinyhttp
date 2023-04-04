import { initAppAndTest } from '../util.ts'
import {
  describe,
  it,
  run,
} from 'https://deno.land/x/tincan@1.0.1/mod.ts'

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

  // describe('URL extensions', () => {
  //   it.only('req.query is being parsed properly', async () => {
  //     const { request } = initAppAndTest((req, res) => void res.json(req.query))

  //     await request.json('/?param1=val1&param2=val2', (json, res) => {
  //       expect(json).toEqual({
  //         param1: 'val1',
  //         param2: 'val2',
  //       })
  //       expect(res.status).toEqual(200)
  //     })
  //   })
  //   it('req.params is being parsed properly', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.json(req.params)
  //       },
  //       '/:param1/:param2',
  //       {},
  //       'get',
  //     )

  //     await request.json('/val1/val2', (json, res) => {
  //       expect(res.status).toBe(200)
  //       expect(json).toEqual({
  //         param1: 'val1',
  //         param2: 'val2',
  //       })
  //     })
  //   })
  // })

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
        {
         
        },
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
        {

        },
        'get',
      )
      const res = await fetch('/')

      res.expect(`secure: false`).expectStatus(200)
    })
    // it('req.subdomains is empty by default', async () => {
    //   const { request } = initAppAndTest(
    //     (req, res) => {
    //       res.send(`subdomains: ${req.subdomains?.join(', ')}`)
    //     },
    //     '/',
    //     {
    //       settings: {
    //         networkExtensions: true,
    //       },
    //     },
    //     'get',
    //   )

    //   await fetch.get('/').expect(200, `subdomains: `)
    // })
  })

  // it('req.xhr is false because of node-superagent', async () => {
  //   const { request } = initAppAndTest((req, res) => {
  //     res.end(`XMLHttpRequest: ${req.xhr ? 'yes' : 'no'}`)
  //   })

  //   await request.text({}, (text, res) => {
  //     expect(res.status).toEqual(200)
  //     expect(text).toEqual(`XMLHttpRequest: no`)
  //   })
  // })

  // it('req.path is the URL but without query parameters', async () => {
  //   const { request } = initAppAndTest((req, res) => {
  //     res.send(`Path to page: ${req.path}`)
  //   })

  //   await fetch.get('/page?a=b').expect(200, `Path to page: /page`)
  // })
  // it('req.path works properly for optional parameters', async () => {
  //   const { request } = initAppAndTest((req, res) => {
  //     res.send(`Path to page: ${req.path}`)
  //   }, '/:format?/:uml?')

  //   await fetch.get('/page/page-1').expect(200, `Path to page: /page/page-1`)
  // })
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
    const res = await fetch('/', {headers: {'If-None-Match': etag }})
    res.expectStatus(304)
  })
})

run()
