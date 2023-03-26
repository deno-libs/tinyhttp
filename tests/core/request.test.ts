import { initAppAndTest } from '../utils.ts'
import {
  describe,
  expect,
  it,
  run,
} from 'https://deno.land/x/tincan@1.0.1/mod.ts'

describe('Request properties', () => {
  it('should have default HTTP Request properties', async () => {
    const { request } = initAppAndTest((req, res) => {
      res.json({
        url: req.url,
      })
    })
    await request.json({}, (json) => {
      expect(json).toEqual({ url: 'http://localhost:8080//' })
    })
  })

  // describe('URL extensions', () => {
  //   it('req.query is being parsed properly', async () => {
  //     const { request } = initAppAndTest((req, res) => void res.send(req.query))

  //     await fetch.get('/?param1=val1&param2=val2').expect(200, {
  //       param1: 'val1',
  //       param2: 'val2',
  //     })
  //   })
  //   it('req.params is being parsed properly', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.send(req.params)
  //       },
  //       '/:param1/:param2',
  //       {},
  //       'get',
  //     )

  //     await fetch.get('/val1/val2').expect(200, {
  //       param1: 'val1',
  //       param2: 'val2',
  //     })
  //   })
  //   it('req.url does not include the mount path', async () => {
  //     const app = new App()

  //     app.use('/abc', (req, res) => void res.send(req.url))

  //     const request = BindToSuperDeno(app)

  //     await request.get('/abc/def').expect(200, '/def')
  //   })
  // })

  // describe('Network extensions', () => {
  //   it('req.ip & req.ips is being parsed properly', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.json({
  //           ip: req.ip,
  //           ips: req.ips,
  //         })
  //       },
  //       '/',
  //       {
  //         settings: {
  //           networkExtensions: true,
  //         },
  //       },
  //       'get',
  //     )

  //     await fetch.get('/').expect(200, {
  //       ip: '127.0.0.1',
  //       ips: ['127.0.0.1'],
  //     })
  //   })
  //   it('req.protocol is http by default', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.send(`protocol: ${req.protocol}`)
  //       },
  //       '/',
  //       {
  //         settings: {
  //           networkExtensions: true,
  //         },
  //       },
  //       'get',
  //     )

  //     await fetch.get('/').expect(200, `protocol: http`)
  //   })
  //   it('req.secure is false by default', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.send(`secure: ${req.secure}`)
  //       },
  //       '/',
  //       {
  //         settings: {
  //           networkExtensions: true,
  //         },
  //       },
  //       'get',
  //     )

  //     await fetch.get('/').expect(200, `secure: false`)
  //   })
  //   it('req.subdomains is empty by default', async () => {
  //     const { request } = initAppAndTest(
  //       (req, res) => {
  //         res.send(`subdomains: ${req.subdomains?.join(', ')}`)
  //       },
  //       '/',
  //       {
  //         settings: {
  //           networkExtensions: true,
  //         },
  //       },
  //       'get',
  //     )

  //     await fetch.get('/').expect(200, `subdomains: `)
  //   })
  // })

  // it('req.xhr is false because of node-superagent', async () => {
  //   const { request } = initAppAndTest((req, res) => {
  //     res.send(`XMLHttpRequest: ${req.xhr ? 'yes' : 'no'}`)
  //   })

  //   await fetch.get('/').expect(200, `XMLHttpRequest: no`)
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
  // it('req.fresh and req.stale get set', async () => {
  //   const etag = '123'
  //   const { request } = initAppAndTest(
  //     (_req, res) => {
  //       res.set('ETag', etag).send('stale')
  //     },
  //     '/',
  //     {},
  //     'get',
  //   )

  //   await fetch.get('/').set('If-None-Match', etag).expect(304)
  // })
})

run()
